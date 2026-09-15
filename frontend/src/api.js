import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const POPULAR_CITIES = [
  { id: 'bengaluru', name: 'Bengaluru', area: 'Indiranagar', lat: 12.9716, lng: 77.5946 },
  { id: 'mumbai', name: 'Mumbai', area: 'Bandra West', lat: 19.0760, lng: 72.8777 },
  { id: 'delhi', name: 'Delhi NCR', area: 'Connaught Place', lat: 28.6139, lng: 77.2090 },
  { id: 'goa', name: 'Goa', area: 'Anjuna Beach', lat: 15.2993, lng: 74.1240 },
  { id: 'hyderabad', name: 'Hyderabad', area: 'Jubilee Hills', lat: 17.3850, lng: 78.4867 },
  { id: 'chennai', name: 'Chennai', area: 'Nungambakkam', lat: 13.0827, lng: 80.2707 },
];

export const DEFAULT_VIDEOGRAPHER_PACKAGES = [];

export const matchesBookingId = (booking, targetId) => {
  if (!booking || targetId === undefined || targetId === null) return false;
  if (booking.id === targetId || String(booking.id) === String(targetId)) return true;
  if (booking.rawId !== undefined && (booking.rawId === targetId || String(booking.rawId) === String(targetId))) return true;
  const cleanBookingId = String(booking.id || '').replace(/^BK-/, '').trim();
  const cleanTargetId = String(targetId).replace(/^BK-/, '').trim();
  return Boolean(cleanBookingId && cleanBookingId === cleanTargetId);
};



export const PLATFORM_CATEGORIES = [
  { id: 'reel_shooter', label: 'Reel Shooter', iconEmoji: '📹', title: 'Reel Shooter & Videographer' },
  { id: 'photographer', label: 'Photographer', iconEmoji: '📷', title: 'Professional Photographer' },
  { id: 'video_editor', label: 'Video Editor', iconEmoji: '✂️', title: 'Video Editor & Post-Production' },
  { id: 'makeup_artist', label: 'Makeup Artist', iconEmoji: '✨', title: 'Makeup & Hair Artist' },
  { id: 'stylist', label: 'Stylist', iconEmoji: '👔', title: 'Fashion & Wardrobe Stylist' },
  { id: 'drone_pilot', label: 'Drone Pilot', iconEmoji: '🚁', title: 'Aerial & Drone Pilot' },
  { id: 'content_creator', label: 'Content Creator', iconEmoji: '🌟', title: 'Digital Content Creator' },
  { id: 'model', label: 'Model / Talent', iconEmoji: '💃', title: 'Fashion Model & Talent' },
];

export const CATEGORY_LABELS = {
  reel_shooter: 'Reel Shooter',
  photographer: 'Photographer',
  video_editor: 'Video Editor',
  makeup_artist: 'Makeup Artist',
  stylist: 'Stylist',
  drone_pilot: 'Drone Pilot',
  content_creator: 'Content Creator',
  model: 'Model / Talent',
  top_rated: 'Top Rated Shooters',
  more: 'All Creators',
  all: 'All Creators',
};

// Real Backend API Service Calls (Django REST API endpoints)
export async function fetchShooters(params = {}) {
  try {
    const res = await api.get('/shooters/', { params });
    return res.data;
  } catch (err) {
    console.warn('Backend fetchShooters fallback:', err.message);
    return null;
  }
}

// Fetch admin-managed creator categories for dropdowns
export async function fetchCategories() {
  try {
    const res = await api.get('/categories/');
    return Array.isArray(res.data) ? res.data : (res.data?.results || []);
  } catch (err) {
    console.warn('Backend fetchCategories fallback:', err.message);
    return [];
  }
}

// Fetch admin-managed promotional banners for Home view
export async function fetchBanners() {
  try {
    const res = await api.get('/banners/');
    return Array.isArray(res.data) ? res.data : (res.data?.results || []);
  } catch (err) {
    console.warn('Backend fetchBanners fallback:', err.message);
    return [];
  }
}


/**
 * Syncs creator profile to Django DB so ALL clients can discover them.
 * Called when a creator saves their profile.
 */
export async function syncCreatorProfile(profileData) {
  try {
    const payload = {
      email: profileData.email,
      display_name: profileData.display_name || profileData.name,
      bio: profileData.bio || '',
      city: profileData.city || '',
      area: profileData.area || '',
      hourly_price: Number(profileData.hourly_price) || 0,
      phone: profileData.phone || '',
      category: profileData.category || '',
      avatar_url: typeof profileData.avatar === 'string' && profileData.avatar.length < 500
        ? profileData.avatar : '',
      equipment: Array.isArray(profileData.equipment)
        ? profileData.equipment.join(', ')
        : (profileData.equipment || ''),
      shooting_styles: Array.isArray(profileData.shooting_styles)
        ? profileData.shooting_styles
        : (profileData.shooting_styles || '').split(',').map(s => s.trim()).filter(Boolean),
      packages: Array.isArray(profileData.packages) ? profileData.packages : [],
      portfolio: Array.isArray(profileData.portfolio) ? profileData.portfolio : [],
      experience_years: parseInt(profileData.experience) || 0,
      is_available: profileData.is_available !== false,
    };
    const res = await api.post('/creators/sync/', payload);
    console.log('✅ Creator profile synced to backend:', res.data);
    return res.data;
  } catch (err) {
    console.warn('Backend syncCreatorProfile failed (profile saved locally):', err.message);
    return null;
  }
}

export async function fetchShooterById(id) {
  try {
    const res = await api.get(`/shooters/${id}/`);
    return res.data;
  } catch (err) {
    console.warn(`Backend fetchShooterById (${id}) fallback:`, err.message);
    return null;
  }
}

export async function updateShooterProfile(id, payload) {
  try {
    const res = await api.patch(`/shooters/${id}/`, payload);
    return res.data;
  } catch (err) {
    console.warn(`Backend updateShooterProfile (${id}) fallback:`, err.message);
    return null;
  }
}

export async function fetchBookings(params = {}) {
  try {
    const res = await api.get('/bookings/', { params });
    return res.data;
  } catch (err) {
    console.warn('Backend fetchBookings fallback:', err.message);
    return [];
  }
}

export async function createBooking(payload) {
  try {
    const res = await api.post('/bookings/', payload);
    return res.data;
  } catch (err) {
    console.warn('Backend createBooking fallback:', err.message);
    return null;
  }
}

export async function updateBookingStatusApi(bookingId, status) {
  try {
    const s = (status || '').toLowerCase();
    const action = (s === 'confirmed' || s === 'accepted') ? 'confirm' : (s === 'declined' || s === 'cancelled' || s === 'rejected') ? 'cancel' : 'complete';
    const res = await api.post(`/bookings/${bookingId}/${action}/`);
    return res.data;
  } catch (err) {
    console.warn(`Backend updateBookingStatusApi (${bookingId}, ${status}) fallback:`, err.message);
    return null;
  }
}

export async function deleteBooking(bookingId) {
  try {
    await api.delete(`/bookings/${bookingId}/`);
    return true;
  } catch (err) {
    console.warn(`Backend deleteBooking (${bookingId}) fallback:`, err.message);
    return false;
  }
}

export async function fetchPortfolioPhotos(shooterId) {
  try {
    const res = await api.get('/portfolio-photos/', { params: { shooter: shooterId } });
    return res.data;
  } catch (err) {
    console.warn('Backend fetchPortfolioPhotos fallback:', err.message);
    return [];
  }
}

export async function fetchReviewsApi(shooterId = null) {
  try {
    const params = shooterId ? { shooter: shooterId } : {};
    const res = await api.get('/reviews/', { params });
    return res.data;
  } catch (err) {
    console.warn('Backend fetchReviewsApi fallback:', err.message);
    return [];
  }
}

export async function submitReviewApi(payload) {
  try {
    const res = await api.post('/reviews/', payload);
    return res.data;
  } catch (err) {
    console.warn('Backend submitReviewApi fallback:', err.message);
    return null;
  }
}
