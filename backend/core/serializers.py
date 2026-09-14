from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    CreatorCategory,
    UserProfile,
    ShooterProfile,
    PortfolioPhoto,
    Availability,
    Booking,
    Review,
    SavedShooter,
    PromotionalBanner,
)


class CreatorCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = CreatorCategory
        fields = ["id", "name", "slug", "icon_emoji", "description", "sort_order"]


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        ]


class UserProfileSerializer(serializers.ModelSerializer):

    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "role",
            "profile_image",
            "phone",
            "city",
            "created_at",
            "updated_at",
        ]


class ShooterProfileSerializer(serializers.ModelSerializer):

    user_profile = UserProfileSerializer(
        source="user",
        read_only=True,
    )

    # Flat convenience fields for the frontend
    avatar = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.user.profile_image or ""

    def get_email(self, obj):
        return obj.user.user.email if obj.user and obj.user.user else ""

    def get_review_count(self, obj):
        return obj.reviews_received.count()

    class Meta:
        model = ShooterProfile
        fields = [
            "id",
            "user_profile",
            "email",
            "avatar",
            "display_name",
            "category",
            "bio",
            "city",
            "area",
            "experience_years",
            "hourly_price",
            "equipment",
            "shooting_styles",
            "packages",
            "portfolio",
            "is_verified",
            "is_available",
            "total_bookings",
            "rating",
            "review_count",
            "created_at",
        ]


class PortfolioPhotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = PortfolioPhoto
        fields = [
            "id",
            "shooter",
            "title",
            "description",
            "category",
            "image_url",
            "location",
            "is_public",
            "views",
            "created_at",
        ]

        read_only_fields = [
            "shooter",
            "views",
            "created_at",
        ]


class AvailabilitySerializer(serializers.ModelSerializer):

    class Meta:
        model = Availability
        fields = [
            "id",
            "shooter",
            "day_of_week",
            "start_time",
            "end_time",
            "is_active",
        ]

        read_only_fields = [
            "shooter",
        ]


class BookingSerializer(serializers.ModelSerializer):

    customer_name = serializers.SerializerMethodField()
    customer_avatar = serializers.SerializerMethodField()
    shooter_name = serializers.CharField(
        source="shooter.display_name",
        read_only=True,
    )
    shooter_avatar = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            first = obj.customer.user.first_name
            last = obj.customer.user.last_name
            full = f"{first} {last}".strip()
            return full or obj.customer.user.username or "Client"
        return "Client"

    def get_customer_avatar(self, obj):
        if obj.customer and getattr(obj.customer, 'profile_image', None):
            return obj.customer.profile_image
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"

    def get_shooter_avatar(self, obj):
        if obj.shooter and obj.shooter.user and obj.shooter.user.profile_image:
            return obj.shooter.user.profile_image
        return "https://ik.imagekit.io/reelshooter/profile_pictures/avatar_1789315475330_vicky_hladynets_C8Ta0gwPbQg_unsplash_1.jpg"

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_avatar",
            "shooter",
            "shooter_name",
            "shooter_avatar",
            "booking_date",
            "start_time",
            "duration_minutes",
            "location",
            "notes",
            "estimated_amount",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "customer",
            "status",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "shooter": {"required": False},
            "booking_date": {"required": False},
            "start_time": {"required": False},
            "estimated_amount": {"required": False},
            "location": {"required": False},
        }


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_avatar = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            first = obj.customer.user.first_name
            last = obj.customer.user.last_name
            full = f"{first} {last}".strip()
            return full or obj.customer.user.username or "Client"
        return "Client"

    def get_customer_avatar(self, obj):
        if obj.customer and getattr(obj.customer, 'profile_image', None):
            return obj.customer.profile_image
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "customer",
            "customer_name",
            "customer_avatar",
            "shooter",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = [
            "customer",
            "created_at",
        ]


class SavedShooterSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavedShooter
        fields = [
            "id",
            "customer",
            "shooter",
            "created_at",
        ]

        read_only_fields = [
            "customer",
            "created_at",
        ]


class PromotionalBannerSerializer(serializers.ModelSerializer):
    image_display_url = serializers.SerializerMethodField()

    def get_image_display_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            try:
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                pass
        return obj.image_url or "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1600"

    class Meta:
        model = PromotionalBanner
        fields = [
            "id",
            "title",
            "subtitle",
            "badge_text",
            "tagline_text",
            "button_text",
            "button_action",
            "category_slug",
            "image",
            "image_url",
            "image_display_url",
            "gradient_overlay",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]