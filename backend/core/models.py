from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class CreatorCategory(models.Model):
    """Admin-managed list of creator categories shown in frontend dropdowns."""

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Display name shown in dropdown (e.g. Reel Shooter)",
    )

    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="URL-safe key used in code (e.g. reel_shooter)",
    )

    icon_emoji = models.CharField(
        max_length=10,
        blank=True,
        default="🎥",
        help_text="Emoji icon shown next to category name",
    )

    description = models.TextField(
        blank=True,
        help_text="Short description of this creator type",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Only active categories appear in the frontend dropdown",
    )

    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Lower number = shown first in dropdown",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "Creator Category"
        verbose_name_plural = "Creator Categories"

    def __str__(self):
        return f"{self.icon_emoji} {self.name}"


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("shooter", "Shooter"),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="customer",
    )

    profile_image = models.URLField(
        blank=True,
        null=True,
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class ShooterProfile(models.Model):
    user = models.OneToOneField(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="shooter_profile",
    )

    display_name = models.CharField(max_length=150)

    category = models.CharField(
        max_length=100,
        blank=True,
        default="reel_shooter",
        help_text="Slug of admin-managed CreatorCategory (e.g. reel_shooter, photographer)",
    )

    bio = models.TextField(blank=True)

    city = models.CharField(max_length=100)

    area = models.CharField(
        max_length=150,
        blank=True,
    )

    experience_years = models.PositiveIntegerField(default=0)

    hourly_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00"))
        ],
    )

    equipment = models.TextField(
        blank=True,
        help_text="Example: iPhone 15 Pro, Sony A7III, Gimbal",
    )

    shooting_styles = models.JSONField(
        default=list,
        blank=True,
    )

    packages = models.JSONField(
        default=list,
        blank=True,
    )

    portfolio = models.JSONField(
        default=list,
        blank=True,
    )

    is_verified = models.BooleanField(default=False)

    is_available = models.BooleanField(default=True)

    total_bookings = models.PositiveIntegerField(default=0)

    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("5.00")),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name


class PortfolioPhoto(models.Model):
    CATEGORY_CHOICES = (
        ("fashion", "Fashion"),
        ("portrait", "Portrait"),
        ("travel", "Travel"),
        ("food", "Food & Lifestyle"),
        ("fitness", "Fitness"),
        ("product", "Product"),
        ("wedding", "Wedding"),
        ("commercial", "Commercial"),
        ("other", "Other"),
    )

    shooter = models.ForeignKey(
        ShooterProfile,
        on_delete=models.CASCADE,
        related_name="portfolio_photos",
    )

    title = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
    )

    image_url = models.TextField(
        blank=True,
        null=True,
        help_text="Base64 encoded image or remote URL",
    )

    location = models.CharField(
        max_length=150,
        blank=True,
    )

    is_public = models.BooleanField(default=True)

    views = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.shooter.display_name} - {self.title}"


class Availability(models.Model):
    DAY_CHOICES = (
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    )

    shooter = models.ForeignKey(
        ShooterProfile,
        on_delete=models.CASCADE,
        related_name="availability",
    )

    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
    )

    start_time = models.TimeField()

    end_time = models.TimeField()

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return (
            f"{self.shooter.display_name} - "
            f"{self.get_day_of_week_display()}"
        )


class Booking(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("rejected", "Rejected"),
    )

    customer = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="customer_bookings",
    )

    shooter = models.ForeignKey(
        ShooterProfile,
        on_delete=models.CASCADE,
        related_name="shooter_bookings",
    )

    booking_date = models.DateField()

    start_time = models.TimeField()

    duration_minutes = models.PositiveIntegerField(default=60)

    location = models.CharField(max_length=255)

    notes = models.TextField(blank=True)

    estimated_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00"))
        ],
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.customer.user.username} → "
            f"{self.shooter.display_name}"
        )


class Review(models.Model):
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="review",
    )

    customer = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )

    shooter = models.ForeignKey(
        ShooterProfile,
        on_delete=models.CASCADE,
        related_name="reviews_received",
    )

    rating = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shooter.display_name} - {self.rating} stars"


class SavedShooter(models.Model):
    customer = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="saved_shooters",
    )

    shooter = models.ForeignKey(
        ShooterProfile,
        on_delete=models.CASCADE,
        related_name="saved_by",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "shooter"],
                name="unique_saved_shooter",
            )
        ]

    def __str__(self):
        return (
            f"{self.customer.user.username} saved "
            f"{self.shooter.display_name}"
        )


class PromotionalBanner(models.Model):
    title = models.CharField(
        max_length=200,
        default="Create Amazing Reels",
        help_text="Main heading on banner, e.g. 'Create Amazing Reels'"
    )
    subtitle = models.TextField(
        blank=True,
        default="Find the best reel shooters, photographers & creators near you.",
        help_text="Supporting subtext or description"
    )
    badge_text = models.CharField(
        max_length=80,
        blank=True,
        default="Your Creative Partner",
        help_text="Pill tag shown above title, e.g. 'Your Creative Partner'"
    )
    tagline_text = models.CharField(
        max_length=120,
        blank=True,
        default="Your Story Our Creators",
        help_text="Accent script text on the right side, e.g. 'Your Story Our Creators'"
    )
    button_text = models.CharField(
        max_length=60,
        default="Book Now",
        help_text="Text shown on CTA button"
    )
    button_action = models.CharField(
        max_length=100,
        default="search",
        help_text="Action screen or URL, e.g. 'search', 'reel_shooter'"
    )
    category_slug = models.CharField(
        max_length=80,
        blank=True,
        default="reel_shooter",
        help_text="Category to filter when clicked (e.g. 'reel_shooter', 'all')"
    )
    image = models.ImageField(
        upload_to="banners/",
        blank=True,
        null=True,
        help_text="Upload banner image directly from your computer (preferred)"
    )
    image_url = models.URLField(
        max_length=800,
        blank=True,
        default="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1600",
        help_text="Or enter an external ImageKit / Unsplash image URL"
    )
    gradient_overlay = models.CharField(
        max_length=150,
        blank=True,
        default="from-slate-950 via-slate-950/85 to-transparent",
        help_text="Tailwind gradient overlay classes"
    )
    order = models.PositiveIntegerField(default=0, help_text="Display order (lowest first)")
    is_active = models.BooleanField(default=True, help_text="Show this banner on the Home page")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Promotional Banner"
        verbose_name_plural = "Promotional Banners"

    def get_image_url(self):
        if self.image:
            try:
                return self.image.url
            except Exception:
                pass
        return self.image_url or "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1600"

    def __str__(self):
        return f"Banner: {self.title} ({'Active' if self.is_active else 'Inactive'})"