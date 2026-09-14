from unittest.mock import patch
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.media_services import ImageKitService


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


