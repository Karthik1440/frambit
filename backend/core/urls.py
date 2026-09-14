from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CreatorCategoryViewSet,
    CreatorSyncView,
    ShooterViewSet,
    PortfolioPhotoViewSet,
    AvailabilityViewSet,
    BookingViewSet,
    ReviewViewSet,
    SavedShooterViewSet,
    UserProfileViewSet,
    PromotionalBannerViewSet,
    ImageKitAuthView,
    ImageKitUploadView,
)

router = DefaultRouter()
router.register(r"categories", CreatorCategoryViewSet, basename="creatorcategory")
router.register(r"shooters", ShooterViewSet, basename="shooter")
router.register(r"portfolio-photos", PortfolioPhotoViewSet, basename="portfoliophoto")
router.register(r"availability", AvailabilityViewSet, basename="availability")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"saved-shooters", SavedShooterViewSet, basename="savedshooter")
router.register(r"profiles", UserProfileViewSet, basename="userprofile")
router.register(r"banners", PromotionalBannerViewSet, basename="promotionalbanner")

urlpatterns = [
    path("", include(router.urls)),
    path("creators/sync/", CreatorSyncView.as_view(), name="creator-sync"),
    path("media/imagekit-auth/", ImageKitAuthView.as_view(), name="imagekit-auth"),
    path("media/upload/", ImageKitUploadView.as_view(), name="media-upload"),
]



