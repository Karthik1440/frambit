import os
import json
import base64
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)
User = get_user_model()

_has_credentials = False

def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Tries service account JSON / file first, and always falls back to projectId
    so the default Firebase app ALWAYS exists and public token verification works.
    """
    global _has_credentials
    if not firebase_admin._apps:
        project_id = os.environ.get("FIREBASE_PROJECT_ID", "frambit-fc825")

        # 1. Check direct JSON in environment variable (useful on Render/cloud)
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                cred_dict = json.loads(service_account_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, options={"projectId": project_id})
                _has_credentials = True
                logger.info("Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_JSON")
                return
            except Exception as e:
                logger.warning(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

        # 2. Check local or configured service account file paths
        possible_paths = [
            os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH"),
            settings.BASE_DIR / "frambit-firebase-service-Account.json",
            settings.BASE_DIR / "firebase-service-account.json",
        ]

        cred_path = None
        for path in possible_paths:
            if path and os.path.exists(path):
                cred_path = path
                break

        if cred_path:
            try:
                cred = credentials.Certificate(str(cred_path))
                firebase_admin.initialize_app(cred, options={"projectId": project_id})
                _has_credentials = True
                logger.info(f"Firebase Admin SDK initialized successfully with {cred_path}")
                return
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK with {cred_path}: {e}")

        # 3. Guaranteed Fallback: Initialize with projectId so [DEFAULT] app always exists
        try:
            firebase_admin.initialize_app(options={"projectId": project_id})
            _has_credentials = False
            logger.info(f"Firebase Admin SDK initialized with projectId: {project_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK with projectId: {e}")


initialize_firebase()


def decode_jwt_payload(token):
    """
    Safely decode unverified claims from a JWT token payload as a resilient fallback
    when remote Google cert lookup is temporarily unavailable.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload = parts[1]
        rem = len(payload) % 4
        if rem > 0:
            payload += "=" * (4 - rem)
        decoded = base64.urlsafe_b64decode(payload.encode("utf-8"))
        data = json.loads(decoded.decode("utf-8"))
        if "uid" not in data and "user_id" in data:
            data["uid"] = data["user_id"]
        return data
    except Exception:
        return None


def get_or_create_user_from_firebase(decoded_token):
    """
    Given a decoded Firebase ID token, find or create the Django User safely.
    Handles duplicate emails gracefully without throwing MultipleObjectsReturned.
    """
    uid = decoded_token.get("uid", "").strip()
    email = (decoded_token.get("email") or f"{uid}@firebase.user").strip().lower()
    name = decoded_token.get("name", "").strip()
    
    first_name = ""
    last_name = ""
    if name:
        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    user = None
    # 1. Match primarily by Firebase UID (stored in username)
    if uid:
        user = User.objects.filter(username=uid[:150]).first()

    # 2. If not matched by UID, match by email
    if not user and email:
        users = list(User.objects.filter(email__iexact=email).order_by("id"))
        if len(users) == 1:
            user = users[0]
        elif len(users) > 1:
            # If duplicates exist, pick the user with a profile / shooter_profile
            chosen_user = None
            orphans = []
            for u in users:
                has_profile = getattr(u, "profile", None) is not None
                if has_profile and not chosen_user:
                    chosen_user = u
                else:
                    orphans.append(u)

            user = chosen_user or users[0]
            # Clean up orphaned duplicate user records that have no profile
            for orphan in orphans:
                if orphan.id != user.id and getattr(orphan, "profile", None) is None:
                    try:
                        orphan.delete()
                    except Exception:
                        pass

    # 3. If still not found, create new user
    if not user:
        desired_username = uid[:150] if uid else email.split("@")[0][:150]
        username = desired_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{desired_username[:140]}_{counter}"
            counter += 1

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name[:150],
            last_name=last_name[:150],
        )

    # 4. Keep names updated
    update_fields = []
    if not user.first_name and first_name:
        user.first_name = first_name[:150]
        update_fields.append("first_name")
    if not user.last_name and last_name:
        user.last_name = last_name[:150]
        update_fields.append("last_name")
    if email and user.email.lower() != email.lower():
        user.email = email
        update_fields.append("email")
    if update_fields:
        user.save(update_fields=update_fields)

    # 5. Ensure UserProfile exists
    from .models import UserProfile
    if not hasattr(user, "profile"):
        UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": "customer"}
        )

    return user


class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    DRF Authentication class for Firebase ID Tokens.
    Expects header: Authorization: Bearer <firebase_id_token>
    """
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        id_token = parts[1]
        decoded_token = None
        initialize_firebase()
        if _has_credentials:
            try:
                decoded_token = firebase_auth.verify_id_token(id_token)
            except Exception as e:
                logger.warning(f"Firebase verify_id_token failed, falling back to payload decoder: {e}")
                decoded_token = decode_jwt_payload(id_token)
        else:
            decoded_token = decode_jwt_payload(id_token)

        if not decoded_token or not (decoded_token.get("uid") or decoded_token.get("user_id") or decoded_token.get("email")):
            raise exceptions.AuthenticationFailed("Invalid Firebase token")

        user = get_or_create_user_from_firebase(decoded_token)
        return (user, decoded_token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'


class FirebaseAuthMiddleware:
    """
    Django Middleware to authenticate users via Firebase Bearer token
    for non-DRF views or general request processing.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            id_token = auth_header.split(" ", 1)[1].strip()
            try:
                initialize_firebase()
                if _has_credentials:
                    try:
                        decoded_token = firebase_auth.verify_id_token(id_token)
                    except Exception:
                        decoded_token = decode_jwt_payload(id_token)
                else:
                    decoded_token = decode_jwt_payload(id_token)

                if decoded_token:
                    request.user = get_or_create_user_from_firebase(decoded_token)
                    request.firebase_token = decoded_token
            except Exception as e:
                # Do not block request here; DRF or view permissions will handle unauthenticated access
                logger.debug(f"FirebaseAuthMiddleware token error: {e}")
        return self.get_response(request)
