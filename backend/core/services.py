from decimal import Decimal

from .models import ShooterProfile


def calculate_booking_amount(
    shooter: ShooterProfile,
    duration_minutes: int,
) -> Decimal:

    if duration_minutes <= 0:
        raise ValueError("Duration must be greater than 0.")

    hours = Decimal(duration_minutes) / Decimal("60")

    return shooter.hourly_price * hours


def update_shooter_rating(
    shooter: ShooterProfile,
) -> None:

    reviews = shooter.reviews_received.all()

    if not reviews.exists():
        shooter.rating = Decimal("0.00")
        shooter.save(update_fields=["rating"])
        return

    total = sum(review.rating for review in reviews)

    average = Decimal(total) / Decimal(reviews.count())

    shooter.rating = average.quantize(Decimal("0.01"))

    shooter.save(update_fields=["rating"])


def increment_shooter_bookings(
    shooter: ShooterProfile,
) -> None:

    shooter.total_bookings += 1

    shooter.save(
        update_fields=["total_bookings"]
    )