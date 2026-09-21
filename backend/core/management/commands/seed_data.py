import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import (
    CreatorCategory,
    PromotionalBanner,
    UserProfile,
    ShooterProfile,
    Package,
    PortfolioPhoto,
    Booking,
    Review,
)


CATEGORIES = [
    {"name": "Reel Shooter",     "slug": "reel_shooter",     "icon_emoji": "📹", "sort_order": 1, "description": "Short-form video specialists for Instagram & YouTube Reels."},
    {"name": "Photographer",     "slug": "photographer",     "icon_emoji": "📷", "sort_order": 2, "description": "Professional photographers for portraits, events, and brands."},
    {"name": "Video Editor",     "slug": "video_editor",     "icon_emoji": "✂️",  "sort_order": 3, "description": "Post-production experts for cuts, colour, and motion graphics."},
    {"name": "Makeup Artist",    "slug": "makeup_artist",    "icon_emoji": "✨", "sort_order": 4, "description": "Beauty and hair professionals for shoots and events."},
    {"name": "Stylist",          "slug": "stylist",          "icon_emoji": "👔", "sort_order": 5, "description": "Fashion and wardrobe stylists for shoots and lookbooks."},
    {"name": "Drone Pilot",      "slug": "drone_pilot",      "icon_emoji": "🚁", "sort_order": 6, "description": "Licensed aerial cinematographers for cinematic drone footage."},
    {"name": "Content Creator",  "slug": "content_creator",  "icon_emoji": "🌟", "sort_order": 7, "description": "Multi-format digital content creators for brands and influencers."},
    {"name": "Model / Talent",   "slug": "model",            "icon_emoji": "💃", "sort_order": 8, "description": "Experienced fashion models and on-camera talent."},
]

BANNERS = [
    {
        "title": "Create Amazing Reels",
        "subtitle": "Find the best reel shooters, photographers & creators near you.",
        "badge_text": "Your Creative Partner",
        "tagline_text": "Your Story Our Creators",
        "button_text": "Book Now",
        "button_action": "search",
        "category_slug": "reel_shooter",
        "image_url": "https://ik.imagekit.io/reelshooter/banners/hero_banner_reels.jpg",
        "order": 1,
        "is_active": True,
    },
    {
        "title": "Drone Aerial Shoots",
        "subtitle": "Stunning aerial cinematography for weddings, events, and brand films.",
        "badge_text": "Now Available",
        "tagline_text": "Above & Beyond",
        "button_text": "Find Drone Pilots",
        "button_action": "explore",
        "category_slug": "drone_pilot",
        "image_url": "https://ik.imagekit.io/reelshooter/banners/hero_banner_drone.jpg",
        "order": 2,
        "is_active": True,
    },
]

CREATORS = [
    {
        "username": "dhanush_gowda",
        "email": "dhanush@frambit.com",
        "first_name": "Dhanush",
        "last_name": "Gowda",
        "display_name": "Dhanush Gowda",
        "phone": "+91 98765 43210",
        "city": "Bengaluru",
        "area": "Indiranagar",
        "category": "reel_shooter",
        "instagram_handle": "dhanush_creates",
        "bio": "Specialized in dynamic reel production for cafes, fashion brands, and tech startups. Over 4 years crafting high-converting viral reels.",
        "experience_years": 4,
        "hourly_price": Decimal("1499.00"),
        "equipment": "Sony FX3, DJI Ronin RS3, iPhone 15 Pro Max, Aputure Amaran 100x",
        "shooting_styles": ["Cinematic Reels", "Talking Head", "Product Showcases", "Event Coverage"],
        "is_verified": True,
        "is_available": True,
        "total_bookings": 42,
        "rating": Decimal("4.95"),
        "profile_image": "https://ik.imagekit.io/reelshooter/creators/dhanush_avatar.jpg",
        "packages": [
            {
                "title": "Quick Reel Sprint",
                "icon": "⚡",
                "price": Decimal("1999.00"),
                "duration": "1 hour",
                "deliverables": ["1 Edited 4K Reel", "Trending Audio Sync", "Basic Color Grade"],
                "turnaround": "Delivery: 24 hours",
                "popular": False,
                "sort_order": 1,
            },
            {
                "title": "Brand Growth Pack",
                "icon": "🔥",
                "price": Decimal("4999.00"),
                "duration": "3 hours",
                "deliverables": ["3 Cinematic 4K Reels", "Script & Concept Assistance", "Sound Design & Sound Effects", "Raw Footage Included"],
                "turnaround": "Delivery: 48 hours",
                "popular": True,
                "sort_order": 2,
            },
            {
                "title": "Full Day Creator Pass",
                "icon": "👑",
                "price": Decimal("9999.00"),
                "duration": "6 hours",
                "deliverables": ["7 Viral Reels", "Multi-angle Gimbal & Macro Shots", "Re-edits & Revision Round", "Color Graded Master Files"],
                "turnaround": "Delivery: 3 days",
                "popular": False,
                "sort_order": 3,
            },
        ],
        "portfolio": [
            {"title": "Urban Streetwear Fashion Reel", "category": "fashion", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/urban_fashion.jpg", "location": "Church Street, Bengaluru"},
            {"title": "Artisanal Coffee Shop Showcase", "category": "food_lifestyle", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/coffee_shop.jpg", "location": "Indiranagar, Bengaluru"},
            {"title": "Tech Founder Pitch Reel", "category": "commercial", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/founder_pitch.jpg", "location": "Koramangala, Bengaluru"},
        ],
    },
    {
        "username": "priya_nair",
        "email": "priya.nair@frambit.com",
        "first_name": "Priya",
        "last_name": "Nair",
        "display_name": "Priya Nair",
        "phone": "+91 98451 23456",
        "city": "Mumbai",
        "area": "Bandra West",
        "category": "photographer",
        "instagram_handle": "priya.portraits",
        "bio": "Editorial fashion and portrait photographer with Sony Alpha equipment. Featured in lifestyle lookbooks across Mumbai.",
        "experience_years": 5,
        "hourly_price": Decimal("2199.00"),
        "equipment": "Sony A7R V, 85mm f/1.4 GM, 35mm f/1.4 GM, Profoto B10X",
        "shooting_styles": ["Editorial Fashion", "Natural Light Portrait", "Brand Lookbooks", "Studio Lighting"],
        "is_verified": True,
        "is_available": True,
        "total_bookings": 31,
        "rating": Decimal("4.88"),
        "profile_image": "https://ik.imagekit.io/reelshooter/creators/priya_avatar.jpg",
        "packages": [
            {
                "title": "Portrait Essentials",
                "icon": "📸",
                "price": Decimal("2999.00"),
                "duration": "1.5 hours",
                "deliverables": ["10 Retouched High-Res Photos", "Online Gallery Delivery", "2 Wardrobe Changes"],
                "turnaround": "Delivery: 2 days",
                "popular": False,
                "sort_order": 1,
            },
            {
                "title": "Fashion Lookbook",
                "icon": "✨",
                "price": Decimal("6499.00"),
                "duration": "3 hours",
                "deliverables": ["25 Editorial Retouched Photos", "Moodboard & Concept Prep", "High-res & Social Formats", "Full Commercial Usage Rights"],
                "turnaround": "Delivery: 4 days",
                "popular": True,
                "sort_order": 2,
            },
        ],
        "portfolio": [
            {"title": "Sunset Coastal Editorial", "category": "fashion", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/sunset_editorial.jpg", "location": "Bandra Bandstand, Mumbai"},
            {"title": "Monochrome Studio Portrait", "category": "portrait", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/studio_portrait.jpg", "location": "Khar Studio, Mumbai"},
        ],
    },
    {
        "username": "rohan_varma",
        "email": "rohan.drone@frambit.com",
        "first_name": "Rohan",
        "last_name": "Varma",
        "display_name": "Rohan Varma",
        "phone": "+91 97123 45678",
        "city": "Goa",
        "area": "Anjuna Beach",
        "category": "drone_pilot",
        "instagram_handle": "rohan_fpv",
        "bio": "DGCA certified drone pilot specializing in cinematic 4K FPV and aerial landscapes for resort promos, real estate, and music videos.",
        "experience_years": 3,
        "hourly_price": Decimal("2799.00"),
        "equipment": "DJI Mavic 3 Pro Cine, Custom 5\" FPV Drone, DJI Goggles 2",
        "shooting_styles": ["Cinematic Aerial", "High Speed FPV", "Architectural Fly-Through", "Sunset Horizons"],
        "is_verified": True,
        "is_available": True,
        "total_bookings": 27,
        "rating": Decimal("4.92"),
        "profile_image": "https://ik.imagekit.io/reelshooter/creators/rohan_avatar.jpg",
        "packages": [
            {
                "title": "Aerial Highlight",
                "icon": "🚁",
                "price": Decimal("3999.00"),
                "duration": "1 hour",
                "deliverables": ["4K 60fps Drone B-Roll Footage", "Basic Color Profile Delivery", "DGCA Compliance Clearance"],
                "turnaround": "Delivery: 24 hours",
                "popular": False,
                "sort_order": 1,
            },
            {
                "title": "Cinematic FPV Reel",
                "icon": "🌪️",
                "price": Decimal("7999.00"),
                "duration": "3 hours",
                "deliverables": ["4K FPV Dynamic Fly-Throughs", "1 Fully Edited Aerial Reel", "Sound Design & Speed Ramps", "Full Raw Reel D-Log Footages"],
                "turnaround": "Delivery: 48 hours",
                "popular": True,
                "sort_order": 2,
            },
        ],
        "portfolio": [
            {"title": "Cliffside Resort Aerial Flythrough", "category": "commercial", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/resort_aerial.jpg", "location": "Vagator Cliffs, Goa"},
            {"title": "Goan Golden Hour Coastline", "category": "travel", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/goa_sunset.jpg", "location": "Morjim Beach, Goa"},
        ],
    },
    {
        "username": "ananya_sen",
        "email": "ananya.editor@frambit.com",
        "first_name": "Ananya",
        "last_name": "Sen",
        "display_name": "Ananya Sen",
        "phone": "+91 99887 65432",
        "city": "Delhi NCR",
        "area": "Connaught Place",
        "category": "video_editor",
        "instagram_handle": "ananya_edits",
        "bio": "DaVinci Resolve & Premiere Pro certified colorist and editor. Specializing in fast pacing, typography animations, and viral hooks.",
        "experience_years": 4,
        "hourly_price": Decimal("1299.00"),
        "equipment": "MacBook Pro M3 Max, DaVinci Resolve Studio, Sony Reference Monitor",
        "shooting_styles": ["Fast Cuts & Hooks", "Motion Graphics", "Color Grading", "Podcast Micro-Clips"],
        "is_verified": True,
        "is_available": True,
        "total_bookings": 53,
        "rating": Decimal("4.90"),
        "profile_image": "https://ik.imagekit.io/reelshooter/creators/ananya_avatar.jpg",
        "packages": [
            {
                "title": "Reel Polish & Subtitles",
                "icon": "✂️",
                "price": Decimal("1299.00"),
                "duration": "1 day",
                "deliverables": ["1 Edited Reel", "Animated Dynamic Subtitles", "Sound Effects & B-Roll Cuts"],
                "turnaround": "Delivery: 24 hours",
                "popular": False,
                "sort_order": 1,
            },
            {
                "title": "5x Weekly Content Batch",
                "icon": "📦",
                "price": Decimal("5499.00"),
                "duration": "3 days",
                "deliverables": ["5 Fully Edited Reels", "Hooks & Retention Optimization", "Thumbnail & Cover Design", "2 Revision Rounds per Reel"],
                "turnaround": "Delivery: 3 days",
                "popular": True,
                "sort_order": 2,
            },
        ],
        "portfolio": [
            {"title": "Viral Tech Product Reel Edit", "category": "commercial", "image_url": "https://ik.imagekit.io/reelshooter/portfolio/tech_reel_edit.jpg", "location": "Cyber City, Gurugram"},
        ],
    },
]

REVIEWS = [
    {
        "creator_email": "dhanush@frambit.com",
        "client_email": "rohit.sharma@example.com",
        "client_name": "Rohit Sharma",
        "client_avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
        "rating": 5,
        "comment": "Dhanush was incredible! He shot 3 reels for our cafe launch in Indiranagar and they crossed 85k views in 48 hours. Pacing, lighting, and color grading were top notch.",
        "location": "Indiranagar, Bengaluru",
        "service": "Brand Growth Pack",
    },
    {
        "creator_email": "dhanush@frambit.com",
        "client_email": "sneha.patel@example.com",
        "client_name": "Sneha Patel",
        "client_avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
        "rating": 5,
        "comment": "Super professional and punctual. Brought full lighting kit and guided us through all the talking points. The final reel looked like a Netflix commercial!",
        "location": "Koramangala, Bengaluru",
        "service": "Quick Reel Sprint",
    },
    {
        "creator_email": "priya.nair@frambit.com",
        "client_email": "kavita.deshmukh@example.com",
        "client_name": "Kavita Deshmukh",
        "client_avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
        "rating": 5,
        "comment": "Priya's eye for lighting and angles is magical. Our fashion brand lookbook turned out so aesthetic and cohesive. Highly recommended!",
        "location": "Bandra West, Mumbai",
        "service": "Fashion Lookbook",
    },
    {
        "creator_email": "priya.nair@frambit.com",
        "client_email": "arjun.kapoor@example.com",
        "client_name": "Arjun Kapoor",
        "client_avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
        "rating": 5,
        "comment": "Best portrait session I've ever had in Mumbai. Super relaxed and the photos needed almost no retouching. 10/10!",
        "location": "Khar Studio, Mumbai",
        "service": "Portrait Essentials",
    },
    {
        "creator_email": "rohan.drone@frambit.com",
        "client_email": "varun.verma@example.com",
        "client_name": "Varun Verma",
        "client_avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80",
        "rating": 5,
        "comment": "Insane drone skills! The 4K FPV flythrough through our resort in Goa was mindblowing. Our bookings surged immediately.",
        "location": "Vagator, Goa",
        "service": "Cinematic FPV Reel",
    },
    {
        "creator_email": "ananya.editor@frambit.com",
        "client_email": "aditi.rao@example.com",
        "client_name": "Aditi Rao",
        "client_avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
        "rating": 5,
        "comment": "Ananya turned our raw footage into viral gold. Retention rates jumped by 40%. The typography animations are clean and modern.",
        "location": "Delhi NCR",
        "service": "5x Weekly Content Batch",
    },
]


class Command(BaseCommand):
    help = "Seed the database with initial categories, banners, and verified creator profiles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing categories, banners, and seed creators before seeding.",
        )
        parser.add_argument(
            "--no-creators",
            action="store_true",
            help="Seed only categories and banners, skip creator profiles.",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            CreatorCategory.objects.all().delete()
            PromotionalBanner.objects.all().delete()
            seed_emails = [c["email"] for c in CREATORS]
            User.objects.filter(email__in=seed_emails).delete()
            self.stdout.write(self.style.WARNING("Cleared existing categories, banners, and seed creators."))

        # 1. Categories
        cat_created = 0
        for data in CATEGORIES:
            _, created = CreatorCategory.objects.update_or_create(
                slug=data["slug"],
                defaults=data,
            )
            if created:
                cat_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Categories: {cat_created} created / {len(CATEGORIES) - cat_created} updated."
        ))

        # 2. Banners
        banner_created = 0
        for data in BANNERS:
            _, created = PromotionalBanner.objects.update_or_create(
                title=data["title"],
                defaults=data,
            )
            if created:
                banner_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Banners: {banner_created} created / {len(BANNERS) - banner_created} updated."
        ))

        # 3. Creators
        if not options["no_creators"]:
            creators_count = 0
            for c_data in CREATORS:
                packages_data = c_data["packages"]
                portfolio_data = c_data["portfolio"]

                # User
                user, _ = User.objects.update_or_create(
                    username=c_data["username"],
                    defaults={
                        "email": c_data["email"],
                        "first_name": c_data["first_name"],
                        "last_name": c_data["last_name"],
                    },
                )

                # UserProfile
                user_prof, _ = UserProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "role": "shooter",
                        "phone": c_data["phone"],
                        "city": c_data["city"],
                        "profile_image": c_data["profile_image"],
                    },
                )

                # ShooterProfile
                shooter, _ = ShooterProfile.objects.update_or_create(
                    user=user_prof,
                    defaults={
                        "display_name": c_data["display_name"],
                        "category": c_data["category"],
                        "bio": c_data["bio"],
                        "city": c_data["city"],
                        "area": c_data["area"],
                        "instagram_handle": c_data.get("instagram_handle", ""),
                        "experience_years": c_data["experience_years"],
                        "hourly_price": c_data["hourly_price"],
                        "equipment": c_data["equipment"],
                        "shooting_styles": c_data["shooting_styles"],
                        "is_verified": c_data["is_verified"],
                        "is_available": c_data["is_available"],
                        "total_bookings": c_data["total_bookings"],
                        "rating": c_data["rating"],
                    },
                )

                # Packages
                for p_data in packages_data:
                    Package.objects.update_or_create(
                        shooter=shooter,
                        title=p_data["title"],
                        defaults={
                            "icon": p_data["icon"],
                            "price": p_data["price"],
                            "duration": p_data["duration"],
                            "deliverables": p_data["deliverables"],
                            "turnaround": p_data["turnaround"],
                            "popular": p_data["popular"],
                            "sort_order": p_data["sort_order"],
                        },
                    )

                # Portfolio Photos
                for pf_data in portfolio_data:
                    PortfolioPhoto.objects.update_or_create(
                        shooter=shooter,
                        title=pf_data["title"],
                        defaults={
                            "category": pf_data["category"],
                            "image_url": pf_data["image_url"],
                            "location": pf_data["location"],
                            "is_public": True,
                        },
                    )

                creators_count += 1

            self.stdout.write(self.style.SUCCESS(
                f"Creators: {creators_count} profiles seeded with packages and portfolio photos."
            ))

            # 4. Verified Client Reviews
            reviews_count = 0
            for r_data in REVIEWS:
                shooter = ShooterProfile.objects.filter(user__user__email=r_data["creator_email"]).first()
                if not shooter:
                    continue

                client_user, _ = User.objects.update_or_create(
                    username=r_data["client_email"].split("@")[0],
                    defaults={
                        "email": r_data["client_email"],
                        "first_name": r_data["client_name"].split()[0],
                        "last_name": r_data["client_name"].split()[1] if len(r_data["client_name"].split()) > 1 else "",
                    },
                )
                client_profile, _ = UserProfile.objects.update_or_create(
                    user=client_user,
                    defaults={
                        "role": "customer",
                        "profile_image": r_data["client_avatar"],
                    },
                )

                # Create a completed booking to link the review
                booking, _ = Booking.objects.get_or_create(
                    customer=client_profile,
                    shooter=shooter,
                    defaults={
                        "booking_date": datetime.date.today() - datetime.timedelta(days=14),
                        "start_time": datetime.time(14, 0),
                        "duration_minutes": 120,
                        "location": r_data["location"],
                        "notes": r_data["service"],
                        "estimated_amount": Decimal("4999.00"),
                        "status": "completed",
                    },
                )

                Review.objects.update_or_create(
                    booking=booking,
                    defaults={
                        "customer": client_profile,
                        "shooter": shooter,
                        "rating": r_data["rating"],
                        "comment": r_data["comment"],
                    },
                )
                reviews_count += 1

            self.stdout.write(self.style.SUCCESS(
                f"Reviews: {reviews_count} verified client reviews seeded."
            ))

        self.stdout.write(self.style.SUCCESS("Database seeded successfully."))
