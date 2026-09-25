import datetime
import re
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    CreatorCategory,
    UserProfile,
    ShooterProfile,
    Package,
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


class PackageSerializer(serializers.ModelSerializer):
    cover_image = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Package
        fields = [
            "id",
            "shooter",
            "title",
            "icon",
            "price",
            "duration",
            "deliverables",
            "turnaround",
            "cover_image",
            "popular",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["shooter", "created_at", "updated_at"]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)

        # 1. Clean price (supports number, '₹2,500', '1,999.00', etc.)
        price = data.get("price")
        if price is None or price == "":
            data["price"] = "0.00"
        elif isinstance(price, (int, float)):
            data["price"] = f"{float(price):.2f}"
        elif isinstance(price, str):
            cleaned = price.replace(",", "").strip()
            match = re.search(r"\d+(?:\.\d+)?", cleaned)
            data["price"] = f"{float(match.group(0)):.2f}" if match else "0.00"

        # 2. Clean icon
        if not data.get("icon"):
            data["icon"] = "🎥"

        # 3. Clean duration
        if not data.get("duration"):
            data["duration"] = "2 hours"

        # 4. Clean turnaround
        if not data.get("turnaround"):
            data["turnaround"] = "Delivery: 3 days"

        # 5. Clean deliverables (supports list or comma-separated string)
        delivs = data.get("deliverables")
        if isinstance(delivs, str):
            data["deliverables"] = [s.strip() for s in delivs.split(",") if s.strip()]
        elif delivs is None:
            data["deliverables"] = []

        # 6. Clean cover_image (supports imagekit URLs, base64 data URIs, or empty)
        cover = data.get("cover_image") or ""
        if isinstance(cover, str) and cover.startswith("data:image"):
            try:
                from .media_services import ImageKitService
                res = ImageKitService.upload_file(file_data=cover, folder="/packages")
                data["cover_image"] = res.get("url") or "https://ik.imagekit.io/reelshooter/packages/reel_shoot_package.jpg"
            except Exception:
                data["cover_image"] = "https://ik.imagekit.io/reelshooter/packages/reel_shoot_package.jpg"
        elif isinstance(cover, str) and cover and not cover.startswith(("http://", "https://")):
            data["cover_image"] = f"https://{cover}"
        else:
            data["cover_image"] = cover or ""

        # 7. Popular flag
        data["popular"] = bool(data.get("popular", False))

        return super().to_internal_value(data)


class ShooterProfileSerializer(serializers.ModelSerializer):

    user_profile = UserProfileSerializer(
        source="user",
        read_only=True,
    )

    avatar = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    packages = serializers.SerializerMethodField()
    packages_list = PackageSerializer(source="packages_set", many=True, read_only=True)
    portfolio = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.user.profile_image or ""

    def get_email(self, obj):
        return obj.user.user.email if obj.user and obj.user.user else ""

    def get_review_count(self, obj):
        return obj.reviews_received.count()

    def get_packages(self, obj):
        pkgs = list(obj.packages_set.all().order_by("sort_order", "created_at"))
        if pkgs:
            return PackageSerializer(pkgs, many=True).data
        return obj.packages or []

    def get_portfolio(self, obj):
        photos = list(obj.portfolio_photos.filter(is_public=True).order_by("-created_at"))
        if photos:
            return PortfolioPhotoSerializer(photos, many=True).data
        return obj.portfolio or []

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
            "instagram_handle",
            "experience_years",
            "hourly_price",
            "equipment",
            "shooting_styles",
            "packages",        # legacy JSON field (read-only compatibility)
            "packages_list",   # new normalized Package model records
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
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    client_avatar = serializers.SerializerMethodField()
    shooter_name = serializers.CharField(
        source="shooter.display_name",
        read_only=True,
    )
    shooter_avatar = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.customer and obj.customer.user:
            user = obj.customer.user
            first = (user.first_name or "").strip()
            last = (user.last_name or "").strip()
            full = f"{first} {last}".strip()
            if full and full.lower() != "client" and not (len(full) >= 20 and not " " in full):
                return full

            email = (user.email or "").strip()
            if email and "@" in email and not email.endswith("@firebase.user"):
                clean = email.split("@")[0].replace(".", " ").replace("_", " ").title()
                return clean

            username = (user.username or "").strip()
            if username and not (len(username) >= 20 and not " " in username and not "@" in username):
                return username
            return "Client"
        return "Client"

    def get_client_name(self, obj):
        return self.get_customer_name(obj)

    def get_client_email(self, obj):
        if obj.customer and obj.customer.user:
            return obj.customer.user.email or ""
        return ""

    def get_client_avatar(self, obj):
        return self.get_customer_avatar(obj)

    def get_customer_avatar(self, obj):
        if obj.customer and getattr(obj.customer, 'profile_image', None):
            return obj.customer.profile_image
        return None

    def get_shooter_avatar(self, obj):
        if obj.shooter and obj.shooter.user and obj.shooter.user.profile_image:
            return obj.shooter.user.profile_image
        return None

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            data = data.dict()
        elif hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)

        # 1. Resolve shooter
        shooter_val = data.get("shooter") or data.get("shooter_id")
        if shooter_val is not None:
            try:
                shooter_pk = int(shooter_val)
                if ShooterProfile.objects.filter(id=shooter_pk).exists():
                    data["shooter"] = shooter_pk
                else:
                    first_shooter = ShooterProfile.objects.first()
                    if first_shooter:
                        data["shooter"] = first_shooter.id
            except (ValueError, TypeError):
                clean_name = str(shooter_val).replace("creator-", "").replace("-", " ").strip()
                matched = ShooterProfile.objects.filter(display_name__icontains=clean_name).first()
                fallback = matched or ShooterProfile.objects.first()
                if fallback:
                    data["shooter"] = fallback.id
                else:
                    data.pop("shooter", None)
        elif not data.get("shooter"):
            first_shooter = ShooterProfile.objects.first()
            if first_shooter:
                data["shooter"] = first_shooter.id

        # 2. Resolve booking date
        raw_date = data.get("booking_date")
        if raw_date and not isinstance(raw_date, datetime.date):
            raw_str = str(raw_date).strip()
            clean_date = None
            for fmt in ("%Y-%m-%d", "%d %b %Y", "%d %B %Y", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    clean_date = datetime.datetime.strptime(raw_str, fmt).date()
                    break
                except (ValueError, TypeError):
                    continue
            if not clean_date:
                clean_date = datetime.date.today() + datetime.timedelta(days=1)
            data["booking_date"] = clean_date.isoformat()

        # 3. Resolve start time
        raw_time = data.get("start_time")
        if raw_time and not isinstance(raw_time, datetime.time):
            time_str = str(raw_time).strip()
            if " - " in time_str:
                time_str = time_str.split(" - ")[0].strip()
            clean_time = None
            for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M%p"):
                try:
                    clean_time = datetime.datetime.strptime(time_str, fmt).time()
                    break
                except (ValueError, TypeError):
                    continue
            if not clean_time:
                clean_time = datetime.time(16, 0)
            data["start_time"] = clean_time.strftime("%H:%M:%S")

        # 4. Resolve estimated amount
        raw_amount = data.get("estimated_amount") or data.get("amount")
        if raw_amount is not None:
            try:
                clean_amt = str(raw_amount).replace("₹", "").replace(",", "").strip()
                data["estimated_amount"] = str(Decimal(clean_amt))
            except Exception:
                data["estimated_amount"] = "4999.00"

        # 5. Fallback for location & notes
        if not data.get("location"):
            data["location"] = "Bengaluru, Karnataka"

        # 6. Pass through phone_number and requirements
        if "phone_number" not in data:
            data["phone_number"] = ""
        if "requirements" not in data:
            data["requirements"] = ""

        return super().to_internal_value(data)

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_avatar",
            "client_name",
            "client_email",
            "client_avatar",
            "shooter",
            "shooter_name",
            "shooter_avatar",
            "booking_date",
            "start_time",
            "duration_minutes",
            "location",
            "notes",
            "phone_number",
            "requirements",
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
    shooter_id = serializers.IntegerField(source="shooter.id", read_only=True)
    booking_id = serializers.IntegerField(source="booking.id", read_only=True)

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
        return None

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "booking_id",
            "customer",
            "customer_name",
            "customer_avatar",
            "shooter",
            "shooter_id",
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
    image = serializers.SerializerMethodField()

    def get_image_display_url(self, obj):
        if obj.image_url:
            return obj.image_url
        request = self.context.get("request")
        if obj.image:
            try:
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                pass
        return None

    def get_image(self, obj):
        return self.get_image_display_url(obj)

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