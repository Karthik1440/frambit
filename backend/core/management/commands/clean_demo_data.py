from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import ShooterProfile, Booking, Review, Package, PortfolioPhoto, UserProfile

class Command(BaseCommand):
    help = "Remove all demo creators, demo clients, demo bookings, and demo reviews from the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        # Identify demo users by known seed domains and usernames
        demo_emails = [
            "dhanush@frambit.com",
            "priya.nair@frambit.com",
            "priya@frambit.com",
            "rohan.drone@frambit.com",
            "rohan@frambit.com",
            "ananya.editor@frambit.com",
            "ananya@frambit.com",
            "yy@gmail.com",
        ]

        demo_users = User.objects.filter(
            email__in=demo_emails
        ) | User.objects.filter(
            email__icontains="@example.com"
        )

        user_count = demo_users.count()
        user_emails = list(demo_users.values_list("email", flat=True))

        demo_user_profiles = UserProfile.objects.filter(user__in=demo_users)
        demo_shooters = ShooterProfile.objects.filter(user__in=demo_user_profiles)
        shooter_count = demo_shooters.count()
        shooter_names = list(demo_shooters.values_list("display_name", flat=True))

        demo_bookings = Booking.objects.filter(
            customer__in=demo_user_profiles
        ) | Booking.objects.filter(
            shooter__in=demo_shooters
        )
        booking_count = demo_bookings.count()

        demo_reviews = Review.objects.filter(
            customer__in=demo_user_profiles
        ) | Review.objects.filter(
            shooter__in=demo_shooters
        )
        review_count = demo_reviews.count()

        demo_packages = Package.objects.filter(shooter__in=demo_shooters)
        package_count = demo_packages.count()

        demo_photos = PortfolioPhoto.objects.filter(shooter__in=demo_shooters)
        photo_count = demo_photos.count()

        self.stdout.write(f"Found {user_count} demo user(s): {user_emails}")
        self.stdout.write(f"Found {shooter_count} demo shooter(s): {shooter_names}")
        self.stdout.write(f"Found {booking_count} demo booking(s)")
        self.stdout.write(f"Found {review_count} demo review(s)")
        self.stdout.write(f"Found {package_count} demo package(s)")
        self.stdout.write(f"Found {photo_count} demo portfolio photo(s)")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete. No records were deleted."))
            return

        # Perform cascade deletion starting from bookings and reviews
        demo_reviews.delete()
        demo_bookings.delete()
        demo_photos.delete()
        demo_packages.delete()
        demo_shooters.delete()
        demo_user_profiles.delete()
        demo_users.delete()

        self.stdout.write(self.style.SUCCESS("All demo data successfully removed. Database is clean!"))
