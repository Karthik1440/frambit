import base64
import hashlib
import hmac
import re
import time
import uuid
from typing import Any, Dict, Optional

import requests
from django.conf import settings


class ImageKitService:
    """Service wrapper for ImageKit.io image and video uploads & authentication."""

    @staticmethod
    def get_auth_parameters(expire_seconds: int = 1800) -> Dict[str, Any]:
        """
        Generate authentication parameters required for client-side (frontend) upload SDKs.
        Works for both image and video uploads directly from the browser to ImageKit.
        Returns:
            dict containing token, expire, signature, publicKey, and urlEndpoint.
        """
        private_key = getattr(settings, "IMAGEKIT_PRIVATE_KEY", "")
        public_key = getattr(settings, "IMAGEKIT_PUBLIC_KEY", "")
        url_endpoint = getattr(settings, "IMAGEKIT_URL_ENDPOINT", "")

        token = str(uuid.uuid4())
        expire = int(time.time()) + expire_seconds

        # ImageKit signature algorithm: HMAC-SHA1 of (token + expire) signed with private key
        signature = hmac.new(
            private_key.encode("utf-8"),
            f"{token}{expire}".encode("utf-8"),
            hashlib.sha1,
        ).hexdigest()

        return {
            "token": token,
            "expire": expire,
            "signature": signature,
            "publicKey": public_key,
            "urlEndpoint": url_endpoint,
        }

    @staticmethod
    def upload_file(
        file_data: Any,
        file_name: str,
        folder: str = "/uploads",
        use_unique_file_name: bool = False,
        tags: Optional[list] = None,
        is_private_file: bool = False,
    ) -> Dict[str, Any]:
        """
        Upload a file (image or video) directly to ImageKit from the server.
        Args:
            file_data: Binary data, file object, base64 string, or media URL.
            file_name: Desired filename on ImageKit.
            folder: Target folder path on ImageKit.
        """
        # Sanitize file_name to prevent ImageKit URL parsing errors (400 Bad Request on GET)
        file_name = re.sub(r'[^a-zA-Z0-9._-]', '_', file_name)
        file_name = re.sub(r'_+', '_', file_name)

        private_key = getattr(settings, "IMAGEKIT_PRIVATE_KEY", "")
        if not private_key or private_key.startswith("private_your_") or private_key.startswith("your_"):
            # Fallback mock data when real credentials are not configured yet
            mock_id = str(uuid.uuid4()).replace("-", "")
            is_video = any(file_name.lower().endswith(ext) for ext in [".mp4", ".mov", ".avi", ".webm", ".mkv"])
            return {
                "file_id": f"ik_{mock_id}",
                "name": file_name,
                "url": f"https://ik.imagekit.io/demo/{folder.strip('/')}/{file_name}",
                "thumbnail_url": f"https://ik.imagekit.io/demo/{folder.strip('/')}/tr:n-ik_ml_thumbnail/{file_name}" if is_video else f"https://ik.imagekit.io/demo/{folder.strip('/')}/{file_name}",
                "file_type": "non-image" if is_video else "image",
                "height": 720 if is_video else 1080,
                "width": 1280 if is_video else 1080,
                "size": 1024000,
                "is_mock": True,
            }

        upload_url = "https://upload.imagekit.io/api/v1/files/upload"

        # Basic Auth: private key as username, empty password
        auth = (private_key, "")

        data = {
            "fileName": file_name,
            "folder": folder,
            "useUniqueFileName": "true" if use_unique_file_name else "false",
            "isPrivateFile": "true" if is_private_file else "false",
        }

        if tags:
            data["tags"] = ",".join(tags)

        files = None

        if isinstance(file_data, str):
            if file_data.startswith("http://") or file_data.startswith("https://") or file_data.startswith("data:"):
                data["file"] = file_data
            else:
                data["file"] = file_data
        elif hasattr(file_data, "read"):
            if hasattr(file_data, "seek"):
                try:
                    file_data.seek(0)
                except Exception:
                    pass
            content = file_data.read()
            mime_type = getattr(file_data, 'content_type', 'image/jpeg')
            files = {"file": (file_name, content, mime_type)}
        elif isinstance(file_data, bytes):
            files = {"file": (file_name, file_data, "image/jpeg")}
        else:
            data["file"] = str(file_data)

        response = requests.post(
            upload_url,
            auth=auth,
            data=data if files else {**data, "file": data.get("file", "")},
            files=files,
            timeout=60,
        )

        response.raise_for_status()
        res_data = response.json()

        return {
            "file_id": res_data.get("fileId"),
            "name": res_data.get("name"),
            "url": res_data.get("url"),
            "thumbnail_url": res_data.get("thumbnailUrl"),
            "height": res_data.get("height"),
            "width": res_data.get("width"),
            "size": res_data.get("size"),
            "file_type": res_data.get("fileType"),
        }

    @staticmethod
    def delete_file(file_id: str) -> bool:
        """Delete any file (image or video) from ImageKit by file_id."""
        private_key = getattr(settings, "IMAGEKIT_PRIVATE_KEY", "")
        if not private_key:
            return True

        delete_url = f"https://api.imagekit.io/v1/files/{file_id}"
        auth = (private_key, "")

        response = requests.delete(delete_url, auth=auth, timeout=15)
        return response.status_code in (200, 204)
