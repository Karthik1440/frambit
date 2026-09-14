import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, ShooterProfile, CreatorCategory

def seed_database():
    print("--- Seeding Database with Official Creator Categories Only ---")
    
    # 1. Ensure Categories exist
    categories_data = [
        ("Reel Shooter", "reel_shooter", "🎥", "Short-form video specialists for Instagram Reels & TikTok"),
        ("Photographer", "photographer", "📸", "High-res portrait, fashion, product & event photography"),
        ("Video Editor", "video_editor", "✂️", "Post-production, color grading, and video editing"),
        ("Makeup Artist", "makeup_artist", "💄", "Professional bridal, HD, and editorial makeup services"),
        ("Stylist", "stylist", "👗", "Fashion styling, wardrobe consulting, and shoot concept styling"),
        ("Drone Pilot", "drone_pilot", "🛸", "Licensed 4K drone cinematography and aerial footage"),
        ("Content Creator", "content_creator", "✨", "UGC, brand promotion, and creative content creation"),
        ("Model / Talent", "model_talent", "🌟", "Fashion models, actors, and commercial talent")
    ]
    
    for sort_idx, (name, slug, emoji, desc) in enumerate(categories_data):
        CreatorCategory.objects.update_or_create(
            name=name,
            defaults={
                "slug": slug,
                "icon_emoji": emoji,
                "description": desc,
                "sort_order": sort_idx,
                "is_active": True
            }
        )
    print(f"[OK] Ensured {len(categories_data)} categories in DB.")

    # 2. Clean up old sample demo creator profiles from DB (keeping real users like dhanush)
    demo_usernames = ["aarav_reels", "priya_nair_photo", "rohan_drone_fpv", "ananya_editor", "karthik_p_creator"]
    deleted_count, _ = User.objects.filter(username__in=demo_usernames).delete()
    print(f"[OK] Removed {deleted_count} demo user objects from DB.")

    # 3. Clean demo packages/portfolio on real profiles if any exist
    real_shooters = ShooterProfile.objects.all()
    print(f"[OK] Active real creators remaining in DB: {real_shooters.count()}")

if __name__ == '__main__':
    seed_database()
