from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.media_services import ImageKitService
from core.models import UserProfile, ShooterProfile, Package, Booking, Review


class MediaServicesTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_imagekit_auth_parameters_generation(self):
        auth_params = ImageKitService.get_auth_parameters()
        self.assertIn("token", auth_params)
        self.assertIn("expire", auth_params)
        self.assertIn("signature", auth_params)
        self.assertIn("publicKey", auth_params)
        self.assertIn("urlEndpoint", auth_params)
        self.assertTrue(len(auth_params["signature"]) > 0)

    def test_imagekit_auth_endpoint(self):
        response = self.client.get("/api/media/imagekit-auth/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("signature", response.data)

    @patch("core.media_services.requests.post")
    def test_imagekit_upload_file(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "fileId": "ik_file_123",
            "name": "sample_video.mp4",
            "url": "https://ik.imagekit.io/reelshooter/portfolio_videos/sample_video.mp4",
            "thumbnailUrl": "https://ik.imagekit.io/reelshooter/portfolio_videos/tr:n-ik_ml_thumbnail/sample_video.mp4",
            "height": 720,
            "width": 1280,
            "size": 1024000,
            "fileType": "non-image",
        }

        res = ImageKitService.upload_file(
            file_data="https://example.com/test_video.mp4",
            file_name="sample_video.mp4",
            folder="/portfolio_videos",
        )
        self.assertEqual(res["file_id"], "ik_file_123")
        self.assertEqual(res["file_type"], "non-image")
        self.assertIn("reelshooter", res["url"])


class FrambitAuditFixesTestCase(TestCase):
    def setUp(self):
        # Create shooter user & profile
        self.shooter_user = User.objects.create_user(
            username="shooter_user",
            email="shooter@frambit.com",
            password="pass",
        )
        self.shooter_user_profile = UserProfile.objects.create(
            user=self.shooter_user,
            role="shooter",
            city="Bengaluru",
        )
        self.shooter_profile = ShooterProfile.objects.create(
            user=self.shooter_user_profile,
            display_name="Pro Shooter",
            city="Bengaluru",
            category="reel_shooter",
            hourly_price=Decimal("1500.00"),
        )

        # Create customer user & profile
        self.customer_user = User.objects.create_user(
            username="customer_user",
            email="client@frambit.com",
            password="pass",
        )
        self.customer_user_profile = UserProfile.objects.create(
            user=self.customer_user,
            role="customer",
            city="Bengaluru",
        )

        self.anon_client = APIClient()
        self.shooter_client = APIClient()
        self.shooter_client.force_authenticate(user=self.shooter_user)
        self.customer_client = APIClient()
        self.customer_client.force_authenticate(user=self.customer_user)

        # Create Creator B
        self.creator_b_user = User.objects.create_user(
            username="creator_b",
            email="creator_b@frambit.com",
            password="pass",
        )
        self.creator_b_user_profile = UserProfile.objects.create(
            user=self.creator_b_user,
            role="shooter",
            city="Mumbai",
        )
        self.creator_b_profile = ShooterProfile.objects.create(
            user=self.creator_b_user_profile,
            display_name="Creator B",
            city="Mumbai",
            category="photographer",
            hourly_price=Decimal("2000.00"),
        )
        self.creator_b_client = APIClient()
        self.creator_b_client.force_authenticate(user=self.creator_b_user)

    def test_package_crud_and_permissions(self):
        # --- Scenario 1: Creator A creates a package ---
        create_res = self.shooter_client.post("/api/packages/", {
            "title": "Creator A Standard Reel",
            "price": "2999.00",
            "duration": "2 hours",
            "deliverables": ["2 Reels", "Sound Mix"],
        }, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        pkg_id = create_res.data["id"]

        # --- Scenario 1: Creator A can modify own package ---
        update_res = self.shooter_client.patch(f"/api/packages/{pkg_id}/", {
            "title": "Creator A Premium Reel",
            "price": "3499.00",
        }, format="json")
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data["title"], "Creator A Premium Reel")
        self.assertEqual(Decimal(update_res.data["price"]), Decimal("3499.00"))

        # --- Scenario 2: Creator B cannot modify Creator A's package ---
        b_update_res = self.creator_b_client.patch(f"/api/packages/{pkg_id}/", {
            "title": "Hacked by Creator B",
        }, format="json")
        self.assertEqual(b_update_res.status_code, status.HTTP_403_FORBIDDEN)

        b_delete_res = self.creator_b_client.delete(f"/api/packages/{pkg_id}/")
        self.assertEqual(b_delete_res.status_code, status.HTTP_403_FORBIDDEN)

        # --- Scenario 3: Client cannot modify packages ---
        # 3a. Client cannot create package
        client_create_res = self.customer_client.post("/api/packages/", {
            "title": "Client Fake Package",
            "price": "999.00",
            "duration": "1 hour",
        }, format="json")
        self.assertEqual(client_create_res.status_code, status.HTTP_403_FORBIDDEN)

        # 3b. Client cannot update Creator A's package
        client_update_res = self.customer_client.patch(f"/api/packages/{pkg_id}/", {
            "title": "Client Modified Package",
        }, format="json")
        self.assertEqual(client_update_res.status_code, status.HTTP_403_FORBIDDEN)

        # 3c. Client cannot delete Creator A's package
        client_delete_res = self.customer_client.delete(f"/api/packages/{pkg_id}/")
        self.assertEqual(client_delete_res.status_code, status.HTTP_403_FORBIDDEN)

        # --- Scenario 4: Unauthenticated cannot create/update/delete ---
        # 4a. Unauthenticated cannot create
        anon_create_res = self.anon_client.post("/api/packages/", {
            "title": "Anon Package",
            "price": "999.00",
        }, format="json")
        self.assertEqual(anon_create_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4b. Unauthenticated cannot update
        anon_update_res = self.anon_client.patch(f"/api/packages/{pkg_id}/", {
            "title": "Anon Modified",
        }, format="json")
        self.assertEqual(anon_update_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4c. Unauthenticated cannot delete
        anon_delete_res = self.anon_client.delete(f"/api/packages/{pkg_id}/")
        self.assertEqual(anon_delete_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # --- Finally: Creator A can delete own package ---
        del_res = self.shooter_client.delete(f"/api/packages/{pkg_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_booking_permissions_and_ownership(self):
        # 1. Unauthenticated create returns 401
        res = self.anon_client.post("/api/bookings/", {
            "shooter": self.shooter_profile.id,
            "duration_minutes": 60,
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Authenticated customer can create booking
        res = self.customer_client.post("/api/bookings/", {
            "shooter": self.shooter_profile.id,
            "duration_minutes": 60,
            "notes": "Wedding Reel Shoot",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        booking_id = res.data["id"]

        # 3. Third party user cannot confirm booking
        other_user = User.objects.create_user(username="stranger", password="pwd")
        other_profile = UserProfile.objects.create(user=other_user, role="customer")
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)

        res = other_client.post(f"/api/bookings/{booking_id}/confirm/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Shooter can confirm booking
        res = self.shooter_client.post(f"/api/bookings/{booking_id}/confirm/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "confirmed")

    def test_review_creation_permissions(self):
        # 1. Anon cannot create review
        res = self.anon_client.post("/api/reviews/", {
            "shooter": self.shooter_profile.id,
            "rating": 5,
            "comment": "Super work!",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Shooter cannot review themselves (403)
        res = self.shooter_client.post("/api/reviews/", {
            "shooter": self.shooter_profile.id,
            "rating": 5,
            "comment": "I am great!",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @patch("core.firebase_auth.firebase_auth.verify_id_token")
    def test_firebase_authentication(self, mock_verify):
        mock_verify.return_value = {
            "uid": "fb_uid_9999",
            "email": "firebase_user@example.com",
            "name": "Firebase User",
        }
        res = self.anon_client.get(
            "/api/categories/",
            HTTP_AUTHORIZATION="Bearer valid_firebase_token",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Verify user was created in Django
        user_exists = User.objects.filter(email="firebase_user@example.com").exists()
        self.assertTrue(user_exists)

    def test_shooter_instagram_handle_sync_and_retrieve(self):
        # 1. Sync a creator profile with instagram_handle
        sync_payload = {
            "email": "testcreator@frambit.com",
            "display_name": "Test Creator",
            "city": "Bengaluru",
            "hourly_price": 999,
            "instagram_handle": "@creative_lens",
        }
        res = self.anon_client.post("/api/creators/sync/", sync_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        shooter_id = res.data["id"]

        # 2. Verify ShooterProfile in DB has cleaned handle
        shooter = ShooterProfile.objects.get(id=shooter_id)
        self.assertEqual(shooter.instagram_handle, "creative_lens")

        # 3. Verify ShooterProfileSerializer returns instagram_handle
        get_res = self.anon_client.get(f"/api/shooters/{shooter_id}/")
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["instagram_handle"], "creative_lens")

        # 4. Verify UserRoleLookupView returns instagram_handle
        role_res = self.anon_client.get("/api/users/role/", {"email": "testcreator@frambit.com"})
        self.assertEqual(role_res.status_code, status.HTTP_200_OK)
        self.assertEqual(role_res.data["instagram_handle"], "creative_lens")


