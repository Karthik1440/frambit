from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.timezone import localtime
from django.contrib.auth.models import User

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


# ─────────────────────────────────────────────
# CreatorCategory Admin — admin manages dropdown categories
# ─────────────────────────────────────────────
@admin.register(CreatorCategory)
class CreatorCategoryAdmin(admin.ModelAdmin):

    list_display = (
        "icon_emoji",
        "name",
        "slug",
        "active_badge",
        "sort_order",
        "created_at",
    )

    list_editable = ("sort_order",)

    list_filter = ("is_active",)

    search_fields = ("name", "slug")

    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        ("Category Info", {
            "fields": ("name", "slug", "icon_emoji", "description")
        }),
        ("Display Settings", {
            "fields": ("is_active", "sort_order"),
        }),
    )

    @admin.display(description="Status")
    def active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="background:#dcfce7;color:#15803d;padding:2px 10px;'
                'border-radius:10px;font-size:12px;font-weight:600;">✅ Active</span>'
            )
        return format_html(
            '<span style="background:#fee2e2;color:#dc2626;padding:2px 10px;'
            'border-radius:10px;font-size:12px;font-weight:600;">⛔ Hidden</span>'
        )


# ─────────────────────────────────────────────
# Inline: Show ShooterProfile inside UserProfile
# ─────────────────────────────────────────────
class ShooterProfileInline(admin.StackedInline):
    model = ShooterProfile
    fk_name = "user"
    can_delete = False
    extra = 0
    fields = (
        "display_name", "city", "area",
        "hourly_price", "rating", "is_verified",
        "is_available", "total_bookings",
    )
    readonly_fields = ("rating", "total_bookings")


# ─────────────────────────────────────────────
# UserProfile Admin — see all users + their role
# ─────────────────────────────────────────────
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):

    inlines = [ShooterProfileInline]

    list_display = (
        "get_email",
        "get_username",
        "role_badge",
        "city",
        "phone",
        "get_last_login",
        "get_date_joined",
    )

    list_filter = (
        "role",
        "city",
        "user__is_active",
    )

    search_fields = (
        "user__username",
        "user__email",
        "phone",
        "city",
    )

    ordering = ("-user__last_login",)

    readonly_fields = (
        "get_email",
        "get_username",
        "get_last_login",
        "get_date_joined",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Account Info", {
            "fields": ("get_username", "get_email", "role", "phone", "city", "profile_image")
        }),
        ("Timestamps", {
            "fields": ("get_last_login", "get_date_joined", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Email", ordering="user__email")
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description="Username", ordering="user__username")
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description="Last Login", ordering="user__last_login")
    def get_last_login(self, obj):
        if obj.user.last_login:
            dt = localtime(obj.user.last_login)
            return dt.strftime("%d %b %Y, %I:%M %p")
        return format_html('<span style="color:#aaa;">Never</span>')

    @admin.display(description="Joined", ordering="user__date_joined")
    def get_date_joined(self, obj):
        if obj.user.date_joined:
            dt = localtime(obj.user.date_joined)
            return dt.strftime("%d %b %Y")
        return "-"

    @admin.display(description="Role")
    def role_badge(self, obj):
        if obj.role == "shooter":
            return format_html(
                '<span style="background:#4f46e5;color:#fff;padding:2px 10px;'
                'border-radius:12px;font-size:12px;font-weight:600;">🎥 Creator</span>'
            )
        return format_html(
            '<span style="background:#0ea5e9;color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:12px;font-weight:600;">👤 Client</span>'
        )


# ─────────────────────────────────────────────
# ShooterProfile Admin — manage creators
# ─────────────────────────────────────────────
@admin.register(ShooterProfile)
class ShooterProfileAdmin(admin.ModelAdmin):

    list_display = (
        "display_name",
        "get_email",
        "get_last_login",
        "city",
        "hourly_price",
        "rating",
        "verified_badge",
        "available_badge",
        "total_bookings",
    )

    list_filter = (
        "city",
        "is_verified",
        "is_available",
    )

    search_fields = (
        "display_name",
        "city",
        "area",
        "user__user__email",
        "user__user__username",
    )

    ordering = ("-user__user__last_login",)

    readonly_fields = (
        "get_email",
        "get_last_login",
        "get_date_joined",
        "total_bookings",
        "rating",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Creator Info", {
            "fields": (
                "user", "display_name", "bio",
                "city", "area", "experience_years",
                "hourly_price", "equipment", "shooting_styles",
            )
        }),
        ("Account", {
            "fields": ("get_email", "get_last_login", "get_date_joined"),
        }),
        ("Status", {
            "fields": ("is_verified", "is_available", "rating", "total_bookings"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.user.email

    @admin.display(description="Last Login", ordering="user__user__last_login")
    def get_last_login(self, obj):
        last = obj.user.user.last_login
        if last:
            dt = localtime(last)
            return format_html(
                '<span style="color:#16a34a;font-weight:600;">{}</span>',
                dt.strftime("%d %b %Y, %I:%M %p")
            )
        return format_html('<span style="color:#aaa;">Never logged in</span>')

    @admin.display(description="Joined")
    def get_date_joined(self, obj):
        dt = localtime(obj.user.user.date_joined)
        return dt.strftime("%d %b %Y")

    @admin.display(description="Verified")
    def verified_badge(self, obj):
        if obj.is_verified:
            return format_html('<span style="color:#16a34a;font-size:16px;">✅</span>')
        return format_html('<span style="color:#aaa;font-size:16px;">—</span>')

    @admin.display(description="Available")
    def available_badge(self, obj):
        if obj.is_available:
            return format_html(
                '<span style="background:#dcfce7;color:#15803d;padding:2px 8px;'
                'border-radius:10px;font-size:12px;">Online</span>'
            )
        return format_html(
            '<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;'
            'border-radius:10px;font-size:12px;">Offline</span>'
        )


# ─────────────────────────────────────────────
# PortfolioVideo Admin
# ─────────────────────────────────────────────
@admin.register(PortfolioPhoto)
class PortfolioPhotoAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "shooter",
        "category",
        "location",
        "is_public",
        "views",
        "created_at",
    )

    list_filter = (
        "category",
        "is_public",
    )

    search_fields = (
        "title",
        "shooter__display_name",
        "location",
    )


# ─────────────────────────────────────────────
# Availability Admin
# ─────────────────────────────────────────────
@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):

    list_display = (
        "shooter",
        "day_of_week",
        "start_time",
        "end_time",
        "is_active",
    )

    list_filter = (
        "day_of_week",
        "is_active",
    )


# ─────────────────────────────────────────────
# Booking Admin
# ─────────────────────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):

    list_display = (
        "customer",
        "shooter",
        "booking_date",
        "start_time",
        "estimated_amount",
        "status_badge",
        "created_at",
    )

    list_filter = (
        "status",
        "booking_date",
    )

    search_fields = (
        "customer__user__username",
        "customer__user__email",
        "shooter__display_name",
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "pending":   ("#fef08a", "#854d0e"),
            "confirmed": ("#bbf7d0", "#15803d"),
            "completed": ("#dbeafe", "#1d4ed8"),
            "cancelled": ("#fee2e2", "#dc2626"),
            "rejected":  ("#f3f4f6", "#6b7280"),
        }
        bg, fg = colors.get(obj.status, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;'
            'border-radius:10px;font-size:12px;font-weight:600;">{}</span>',
            bg, fg, obj.get_status_display()
        )


# ─────────────────────────────────────────────
# Review Admin
# ─────────────────────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):

    list_display = (
        "customer",
        "shooter",
        "star_rating",
        "created_at",
    )

    list_filter = ("rating",)

    search_fields = (
        "customer__user__username",
        "shooter__display_name",
    )

    @admin.display(description="Rating")
    def star_rating(self, obj):
        stars = "⭐" * obj.rating
        return format_html('<span title="{}/5">{}</span>', obj.rating, stars)


# ─────────────────────────────────────────────
# SavedShooter Admin
# ─────────────────────────────────────────────
@admin.register(SavedShooter)
class SavedShooterAdmin(admin.ModelAdmin):

    list_display = (
        "customer",
        "shooter",
        "created_at",
    )

    search_fields = (
        "customer__user__username",
        "shooter__display_name",
    )


# ─────────────────────────────────────────────
# PromotionalBanner Admin — Admin uploads banner image & texts
# ─────────────────────────────────────────────
@admin.register(PromotionalBanner)
class PromotionalBannerAdmin(admin.ModelAdmin):
    list_display = (
        "banner_thumbnail",
        "title",
        "badge_text",
        "imagekit_link",
        "button_text",
        "order",
        "active_badge",
        "updated_at",
    )
    list_editable = ("order",)
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle", "badge_text", "tagline_text")
    readonly_fields = ("banner_preview", "created_at", "updated_at")

    fieldsets = (
        ("Banner Copy & Texts (Shown on Client Home)", {
            "fields": (
                "badge_text",
                "title",
                "subtitle",
                "tagline_text",
            ),
            "description": "Customize the headline, subtitle, top pill badge, and right-hand accent script.",
        }),
        ("Call To Action Button", {
            "fields": (
                "button_text",
                "button_action",
                "category_slug",
            ),
        }),
        ("Banner Image Upload (ImageKit Synced)", {
            "fields": (
                "image",
                "image_url",
                "banner_preview",
            ),
            "description": "Upload an image file directly from your computer (it will be automatically uploaded to ImageKit and the URL stored in Image URL), or paste an external ImageKit / image URL.",
        }),
        ("Display & Status", {
            "fields": (
                "gradient_overlay",
                "order",
                "is_active",
                "created_at",
                "updated_at",
            ),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.image_url:
            messages.success(request, f"Banner image hosted on ImageKit: {obj.image_url}")

    @admin.display(description="Image Preview")
    def banner_thumbnail(self, obj):
        url = obj.get_image_url()
        if url:
            return format_html(
                '<img src="{}" style="width:100px;height:45px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;" />',
                url
            )
        return format_html('<span style="color:#94a3b8;font-size:11px;">No Image</span>')

    @admin.display(description="ImageKit URL")
    def imagekit_link(self, obj):
        if obj.image_url:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener noreferrer" style="color:#0284c7;font-size:11px;font-weight:600;text-decoration:underline;">View on ImageKit ↗</a>',
                obj.image_url
            )
        return format_html('<span style="color:#94a3b8;font-size:11px;">Local file only</span>')

    @admin.display(description="Full Banner Preview")
    def banner_preview(self, obj):
        url = obj.get_image_url()
        if url:
            return format_html(
                '<div style="max-width:500px;border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">'
                '<img src="{}" style="width:100%;height:180px;object-fit:cover;display:block;" />'
                '</div>',
                url
            )
        return "Save the banner or enter an image URL / file upload to see preview."

    @admin.display(description="Status")
    def active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">Active</span>'
            )
        return format_html(
            '<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">Disabled</span>'
        )