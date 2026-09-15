import datetime
from decimal import Decimal
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .media_services import ImageKitService

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

from .serializers import (
    CreatorCategorySerializer,
    UserProfileSerializer,
    ShooterProfileSerializer,
    PortfolioPhotoSerializer,
    AvailabilitySerializer,
    BookingSerializer,
    ReviewSerializer,
    SavedShooterSerializer,
    PromotionalBannerSerializer,
)


from .permissions import (
    IsCustomer,
    IsShooter,
)

from .services import (
    calculate_booking_amount,
    update_shooter_rating,
    increment_shooter_bookings,
)


class CreatorSyncView(APIView):
    """
    Public endpoint — syncs a creator's profile from the frontend (Firebase auth)
    into the Django DB so they appear on the home page for all clients.

    POST /api/creators/sync/
    Body: { email, display_name, bio, city, area, hourly_price,
            phone, category, avatar_url, equipment, shooting_styles,
            experience_years, instagram_handle, is_available }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get("email", "").strip().lower()
        display_name = data.get("display_name") or data.get("name") or "Creator"

        if not email:
            return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get or create Django User from email
        username = email.split("@")[0].replace(".", "_").replace("+", "_")[:150]
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={"username": username, "first_name": display_name.split()[0] if display_name else ""},
        )
        # Keep display name in sync
        if user.first_name != display_name:
            user.first_name = display_name
            user.save(update_fields=["first_name"])

        # 2. Get or create UserProfile
        user_profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": "shooter", "phone": data.get("phone", ""), "city": data.get("city", "")},
        )
        user_profile.role = "shooter"
        user_profile.phone = data.get("phone", user_profile.phone)
        user_profile.city = data.get("city", user_profile.city)
        if data.get("avatar_url"):
            user_profile.profile_image = data["avatar_url"][:500] if len(data["avatar_url"]) < 500 else ""
        user_profile.save()

        # 3. Get or create ShooterProfile
        shooter_defaults = {
            "display_name": display_name,
            "category": data.get("category", "reel_shooter") or "reel_shooter",
            "bio": data.get("bio", ""),
            "city": data.get("city", ""),
            "area": data.get("area", ""),
            "hourly_price": data.get("hourly_price", 0) or 0,
            "equipment": data.get("equipment", ""),
            "shooting_styles": data.get("shooting_styles", []) or [],
            "packages": data.get("packages", []) or [],
            "portfolio": data.get("portfolio", []) or [],
            "experience_years": int(data.get("experience_years", 0) or 0),
            "is_available": data.get("is_available", True),
            "is_verified": False,
        }
        shooter, created = ShooterProfile.objects.get_or_create(
            user=user_profile,
            defaults=shooter_defaults,
        )
        if not created:
            # Update existing record
            for field, value in shooter_defaults.items():
                setattr(shooter, field, value)
            shooter.save()

        return Response({
            "id": shooter.id,
            "display_name": shooter.display_name,
            "created": created,
            "message": "Creator profile synced successfully.",
        }, status=status.HTTP_200_OK)


class CreatorCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only endpoint — returns only active categories ordered by sort_order."""

    queryset = CreatorCategory.objects.filter(is_active=True)
    serializer_class = CreatorCategorySerializer
    permission_classes = [AllowAny]


class ShooterViewSet(viewsets.ModelViewSet):

    queryset = ShooterProfile.objects.select_related(
        "user"
    ).all()

    serializer_class = ShooterProfileSerializer

    def get_permissions(self):

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):

        queryset = ShooterProfile.objects.select_related(
            "user", "user__user"
        ).all()

        city = self.request.query_params.get("city")

        category = self.request.query_params.get("category")

        available = self.request.query_params.get("available")

        if city:
            queryset = queryset.filter(
                city__iexact=city
            )

        if available == "true":
            queryset = queryset.filter(
                is_available=True
            )

        if category:
            queryset = queryset.filter(
                Q(category__iexact=category) | Q(shooting_styles__contains=[category])
            )

        return queryset


class PortfolioPhotoViewSet(viewsets.ModelViewSet):

    queryset = PortfolioPhoto.objects.select_related(
        "shooter"
    ).all()

    serializer_class = PortfolioPhotoSerializer

    def get_permissions(self):

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):

        profile = get_object_or_404(
            UserProfile,
            user=self.request.user,
            role="shooter",
        )

        shooter = get_object_or_404(
            ShooterProfile,
            user=profile,
        )

        serializer.save(shooter=shooter)

    def get_queryset(self):

        queryset = self.queryset

        shooter_id = self.request.query_params.get(
            "shooter"
        )

        if shooter_id:
            queryset = queryset.filter(
                shooter_id=shooter_id
            )

        return queryset.filter(
            is_public=True
        )



class AvailabilityViewSet(viewsets.ModelViewSet):

    serializer_class = AvailabilitySerializer

    permission_classes = [
        IsAuthenticated,
        IsShooter,
    ]

    def get_queryset(self):

        profile = get_object_or_404(
            UserProfile,
            user=self.request.user,
        )

        shooter = get_object_or_404(
            ShooterProfile,
            user=profile,
        )

        return Availability.objects.filter(
            shooter=shooter
        )

    def perform_create(self, serializer):

        profile = get_object_or_404(
            UserProfile,
            user=self.request.user,
        )

        shooter = get_object_or_404(
            ShooterProfile,
            user=profile,
        )

        serializer.save(
            shooter=shooter
        )


class BookingViewSet(viewsets.ModelViewSet):

    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            try:
                profile = UserProfile.objects.get(user=user)
                if profile.role == "customer":
                    return Booking.objects.filter(customer=profile)
                if profile.role == "shooter":
                    return Booking.objects.filter(shooter__user=profile)
            except UserProfile.DoesNotExist:
                pass

        shooter_id = self.request.query_params.get("shooter") or self.request.query_params.get("shooter_id")
        if shooter_id:
            return Booking.objects.filter(shooter_id=shooter_id)

        customer_email = self.request.query_params.get("customer_email") or self.request.query_params.get("email")
        if customer_email:
            return Booking.objects.filter(customer__user__email__iexact=customer_email)

        return Booking.objects.all().order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Allow passing flexible booking data from the frontend
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # 1. Resolve shooter
        shooter_id = data.get("shooter") or data.get("shooter_id")
        shooter = None
        if shooter_id:
            try:
                shooter = ShooterProfile.objects.filter(id=int(shooter_id)).first()
            except (ValueError, TypeError):
                clean_name = str(shooter_id).replace("creator-", "").replace("-", " ").strip()
                shooter = ShooterProfile.objects.filter(display_name__icontains=clean_name).first()
        if not shooter:
            shooter = ShooterProfile.objects.first()
        if not shooter:
            default_user, _ = User.objects.get_or_create(
                username="default_creator",
                defaults={"first_name": "Frambit", "last_name": "Creator", "email": "creator@frambit.com"}
            )
            default_prof, _ = UserProfile.objects.get_or_create(
                user=default_user,
                defaults={"role": "shooter", "city": "Bengaluru"}
            )
            shooter, _ = ShooterProfile.objects.get_or_create(
                user=default_prof,
                defaults={"display_name": "Frambit Creator", "city": "Bengaluru", "category": "reel_shooter", "hourly_price": Decimal("2500.00")}
            )
        data["shooter"] = shooter.id

        # 2. Resolve booking date
        raw_date = data.get("booking_date")
        clean_date = None
        if raw_date:
            raw_str = str(raw_date).strip()
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
        clean_time = None
        if raw_time:
            time_str = str(raw_time).strip()
            if " - " in time_str:
                time_str = time_str.split(" - ")[0].strip()
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
        duration = int(data.get("duration_minutes", 60) or 60)
        raw_amount = data.get("estimated_amount") or data.get("amount")
        if raw_amount:
            try:
                clean_amt = str(raw_amount).replace("₹", "").replace(",", "").strip()
                amount = Decimal(clean_amt)
            except Exception:
                amount = calculate_booking_amount(shooter, duration) if shooter else Decimal("4999.00")
        else:
            amount = calculate_booking_amount(shooter, duration) if shooter else Decimal("4999.00")
        data["estimated_amount"] = str(amount)

        # 5. Resolve location and notes
        data["location"] = data.get("location") or "Indiranagar, Bangalore"
        data["notes"] = data.get("notes") or data.get("service") or data.get("requirements") or ""

        # 6. Resolve customer profile
        user = request.user
        profile = None
        if user and user.is_authenticated:
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                pass
        if not profile:
            client_email = (
                data.get("client_email")
                or data.get("customer_email")
                or "guest@frambit.com"
            )
            client_name = (
                data.get("client_name")
                or data.get("customer_name")
                or "Client"
            )
            client_user, _ = User.objects.get_or_create(
                username=client_email,
                defaults={"email": client_email, "first_name": client_name},
            )
            profile, _ = UserProfile.objects.get_or_create(
                user=client_user,
                defaults={"role": "customer"},
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            customer=profile,
            shooter=shooter,
            booking_date=clean_date,
            start_time=clean_time,
            location=data["location"],
            notes=data["notes"],
            estimated_amount=amount,
        )
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        profile = None

        if user and user.is_authenticated:
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                pass

        if not profile:
            client_email = (
                self.request.data.get("client_email")
                or self.request.data.get("customer_email")
                or "guest@frambit.com"
            )
            client_name = (
                self.request.data.get("client_name")
                or self.request.data.get("customer_name")
                or "Client"
            )
            client_user, _ = User.objects.get_or_create(
                username=client_email,
                defaults={"email": client_email, "first_name": client_name},
            )
            profile, _ = UserProfile.objects.get_or_create(
                user=client_user,
                defaults={"role": "customer"},
            )

        shooter_id = self.request.data.get("shooter") or self.request.data.get("shooter_id")
        shooter = None
        if shooter_id:
            shooter = ShooterProfile.objects.filter(id=shooter_id).first()
        if not shooter:
            shooter = ShooterProfile.objects.first()

        duration = int(self.request.data.get("duration_minutes", 60))
        raw_amount = self.request.data.get("estimated_amount") or self.request.data.get("amount")
        if raw_amount:
            try:
                clean_amt = str(raw_amount).replace("₹", "").replace(",", "").strip()
                amount = Decimal(clean_amt)
            except Exception:
                amount = calculate_booking_amount(shooter, duration) if shooter else Decimal("4999.00")
        else:
            amount = calculate_booking_amount(shooter, duration) if shooter else Decimal("4999.00")

        # Booking date handling
        booking_date = self.request.data.get("booking_date")
        if not booking_date or booking_date == "Tomorrow" or "Sep" in str(booking_date):
            booking_date = datetime.date.today() + datetime.timedelta(days=1)

        start_time = self.request.data.get("start_time")
        if not start_time or ":" not in str(start_time):
            start_time = datetime.time(10, 0)
        elif " - " in str(start_time):
            first_part = str(start_time).split(" - ")[0].strip()
            try:
                start_time = datetime.datetime.strptime(first_part, "%I:%M %p").time()
            except Exception:
                start_time = datetime.time(16, 0)

        location = self.request.data.get("location") or "Indiranagar, Bangalore"
        notes = self.request.data.get("notes") or self.request.data.get("service") or self.request.data.get("requirements") or ""

        serializer.save(
            customer=profile,
            shooter=shooter,
            booking_date=booking_date,
            start_time=start_time,
            location=location,
            notes=notes,
            estimated_amount=amount,
        )

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        booking.status = "confirmed"
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        booking = self.get_object()
        booking.status = "completed"
        booking.save(update_fields=["status"])
        increment_shooter_bookings(booking.shooter)
        return Response(BookingSerializer(booking).data)


class ReviewViewSet(viewsets.ModelViewSet):

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        shooter_id = self.request.query_params.get("shooter") or self.request.query_params.get("shooter_id")
        if shooter_id:
            return Review.objects.filter(shooter_id=shooter_id).order_by("-created_at")
        return Review.objects.select_related(
            "customer__user",
            "shooter",
        ).all().order_by("-created_at")

    def create(self, request, *args, **kwargs):
        from rest_framework.exceptions import PermissionDenied

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # 1. Resolve booking ID
        raw_booking = data.get("booking") or data.get("booking_id")
        clean_booking_id = None
        if raw_booking is not None:
            clean_str = str(raw_booking).replace("BK-", "").strip()
            if clean_str.isdigit():
                clean_booking_id = int(clean_str)

        booking = None
        if clean_booking_id:
            booking = Booking.objects.filter(id=clean_booking_id).first()

        # 2. Resolve client / customer UserProfile
        user = request.user
        profile = None
        if user and user.is_authenticated:
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                pass

        if not profile:
            if booking and booking.customer:
                profile = booking.customer
            else:
                client_name = data.get("customer_name") or data.get("client_name") or "Client"
                client_email = data.get("client_email") or f"client_{int(clean_booking_id or 1)}@frambit.com"
                client_user, _ = User.objects.get_or_create(
                    username=client_email,
                    defaults={"email": client_email, "first_name": client_name},
                )
                if not client_user.first_name and client_name:
                    client_user.first_name = client_name
                    client_user.save()
                profile, _ = UserProfile.objects.get_or_create(
                    user=client_user,
                    defaults={"role": "customer"},
                )

        # 3. Resolve ShooterProfile
        shooter = None
        if booking and booking.shooter:
            shooter = booking.shooter
        raw_shooter = data.get("shooter") or data.get("shooter_id")
        if not shooter and raw_shooter is not None:
            clean_s = str(raw_shooter).replace("creator-", "").strip()
            if clean_s.isdigit():
                shooter = ShooterProfile.objects.filter(id=int(clean_s)).first()
        if not shooter:
            shooter = ShooterProfile.objects.first()

        # Prevent creator from self-reviewing
        if profile and shooter and shooter.user == profile:
            raise PermissionDenied({"detail": "Creators cannot review themselves."})

        # 4. Guarantee completed booking instance for OneToOne relation
        if not booking:
            booking = Booking.objects.create(
                customer=profile,
                shooter=shooter,
                booking_date=datetime.date.today(),
                start_time=datetime.time(10, 0),
                duration_minutes=60,
                location=shooter.city or "Bengaluru, Karnataka",
                notes="Completed Shoot",
                estimated_amount=Decimal("1999.00"),
                status="completed",
            )
        else:
            if booking.status != "completed":
                booking.status = "completed"
                booking.save(update_fields=["status"])

        # 5. Check if a review already exists for this booking (Upsert)
        existing_review = Review.objects.filter(booking=booking).first()

        rating_val = int(data.get("rating") or 5)
        comment_val = (data.get("comment") or "").strip() or "Great shoot experience and high-quality reel delivery!"

        if existing_review:
            existing_review.rating = rating_val
            existing_review.comment = comment_val
            existing_review.save(update_fields=["rating", "comment"])
            review = existing_review
        else:
            review = Review.objects.create(
                booking=booking,
                customer=profile,
                shooter=shooter,
                rating=rating_val,
                comment=comment_val,
            )

        if shooter:
            update_shooter_rating(shooter)

        serializer = self.get_serializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedShooterViewSet(viewsets.ModelViewSet):

    serializer_class = SavedShooterSerializer

    permission_classes = [
        IsAuthenticated,
        IsCustomer,
    ]

    def get_queryset(self):

        profile = get_object_or_404(
            UserProfile,
            user=self.request.user,
        )

        return SavedShooter.objects.filter(
            customer=profile
        )

    def perform_create(self, serializer):

        profile = get_object_or_404(
            UserProfile,
            user=self.request.user,
        )

        serializer.save(
            customer=profile
        )


class UserProfileViewSet(viewsets.ModelViewSet):

    serializer_class = UserProfileSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):

        return UserProfile.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )


class ImageKitAuthView(APIView):
    """
    API view to generate authentication parameters for client-side ImageKit upload SDKs.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            auth_params = ImageKitService.get_auth_parameters()
            return Response(auth_params, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ImageKitUploadView(APIView):
    """
    API view for server-side media upload (images and videos) to ImageKit.
    Accepts multipart file upload or JSON payload containing a file URL / base64 string.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = request.FILES.get("file") or request.data.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file or URL provided under key 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_name = request.data.get("file_name") or getattr(file_obj, "name", "upload_file")
        folder = request.data.get("folder", "/uploads")
        use_unique = request.data.get("use_unique_file_name")
        use_unique_bool = True if use_unique in ("true", True, "True") else False

        try:
            res = ImageKitService.upload_file(
                file_data=file_obj,
                file_name=file_name,
                folder=folder,
                use_unique_file_name=use_unique_bool,
            )
            return Response(res, status=status.HTTP_201_CREATED)
        except Exception as exc:
            import traceback
            print("--- IMAGEKIT UPLOAD EXCEPTION ---")
            traceback.print_exc()
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PromotionalBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public endpoint returning active promotional banners configured by Admin.
    GET /api/banners/
    """
    queryset = PromotionalBanner.objects.filter(is_active=True).order_by("order", "id")
    serializer_class = PromotionalBannerSerializer
    permission_classes = [AllowAny]

