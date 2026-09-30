/**
 * Haversine formula — returns straight-line distance in km between two GPS coords.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Static coordinates lookup for common Indian cities/towns.
 * Keys are lowercase trimmed city names.
 * Used to avoid live geocoding API calls for every creator.
 */
const CITY_COORDS = {
  // Metro cities
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'delhi ncr': [28.6139, 77.2090],
  'ncr': [28.6304, 77.2177],
  'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.3910],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'goa': [15.2993, 74.1240],
  'panaji': [15.4909, 73.8278],
  'kochi': [9.9312, 76.2673],
  'cochin': [9.9312, 76.2673],
  'thiruvananthapuram': [8.5241, 76.9366],
  'trivandrum': [8.5241, 76.9366],
  'kozhikode': [11.2588, 75.7804],
  'calicut': [11.2588, 75.7804],
  'thrissur': [10.5276, 76.2144],
  'malappuram': [11.0510, 76.0711],
  'kannur': [11.8745, 75.3704],
  'palakkad': [10.7867, 76.6548],
  'kollam': [8.8932, 76.6141],
  'alappuzha': [9.4981, 76.3388],
  'kottayam': [9.5916, 76.5222],
  'idukki': [9.9189, 77.1025],
  'wayanad': [11.6854, 76.1320],
  'kasaragod': [12.4996, 74.9869],
  'pathanamthitta': [9.2648, 76.7870],
  // Kerala taluks / towns
  'nadapuram': [11.6667, 75.6333],
  'koyilandy': [11.4400, 75.7100],
  'vatakara': [11.5968, 75.5950],
  'thalassery': [11.7500, 75.4900],
  'iritty': [11.9960, 75.5060],
  'mananthavady': [11.8000, 76.0000],
  'sulthan bathery': [11.6667, 76.2667],
  'kalpetta': [11.6000, 76.0800],
  'manjeri': [11.1200, 76.1200],
  'tirur': [10.9100, 75.9200],
  'perinthalmanna': [10.9750, 76.2300],
  'ponnani': [10.7750, 75.9200],
  'chalakudy': [10.3000, 76.3300],
  'irinjalakuda': [10.3400, 76.2100],
  'guruvayur': [10.5900, 76.0400],
  'kodungallur': [10.2300, 76.1900],
  'north paravur': [10.1500, 76.2200],
  'aluva': [10.1100, 76.3500],
  'perumbavoor': [10.1100, 76.4800],
  'muvattupuzha': [9.9800, 76.5700],
  'kothamangalam': [10.0500, 76.6300],
  'ettumanoor': [9.6700, 76.5600],
  'pala': [9.7100, 76.6800],
  'changanacherry': [9.4400, 76.5500],
  'cherthala': [9.6900, 76.3400],
  'haripad': [9.2900, 76.4700],
  'kayamkulam': [9.1700, 76.5000],
  'karunagappally': [9.0600, 76.5400],
  'kanjirappally': [9.5500, 76.7900],
  // Other major Indian cities
  'bhopal': [23.2599, 77.4126],
  'indore': [22.7196, 75.8577],
  'nagpur': [21.1458, 79.0882],
  'patna': [25.5941, 85.1376],
  'chandigarh': [30.7333, 76.7794],
  'coimbatore': [11.0168, 76.9558],
  'madurai': [9.9252, 78.1198],
  'visakhapatnam': [17.6868, 83.2185],
  'vijayawada': [16.5062, 80.6480],
  'bhubaneswar': [20.2961, 85.8245],
  'guwahati': [26.1445, 91.7362],
  'dehradun': [30.3165, 78.0322],
  'agra': [27.1767, 78.0081],
  'varanasi': [25.3176, 82.9739],
  'amritsar': [31.6340, 74.8723],
  'jabalpur': [23.1815, 79.9864],
  'srinagar': [34.0837, 74.7973],
  'shimla': [31.1048, 77.1734],
  'mysuru': [12.2958, 76.6394],
  'mysore': [12.2958, 76.6394],
  'hubballi': [15.3647, 75.1240],
  'mangaluru': [12.9141, 74.8560],
  'mangalore': [12.9141, 74.8560],
  'belagavi': [15.8497, 74.4977],
  'udupi': [13.3409, 74.7421],
  'shivamogga': [13.9299, 75.5681],
  'davangere': [14.4644, 75.9218],
};

/**
 * Returns [lat, lng] for a city name, or null if not in the lookup table.
 * Does a fuzzy match by checking if the key is contained in the city name or vice-versa.
 */
export function getCityCoords(cityName) {
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Fuzzy: check if any known key is a substring of the city, or the city is a substring of the key
  for (const [k, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return coords;
  }
  return null;
}

/**
 * Saves the client's GPS coordinates to localStorage with a timestamp.
 */
export function saveClientCoords(lat, lng) {
  try {
    localStorage.setItem('frambit_client_lat', String(lat));
    localStorage.setItem('frambit_client_lng', String(lng));
    localStorage.setItem('frambit_client_coords_at', String(Date.now()));
  } catch (e) {}
}

/**
 * Reads the client's saved GPS coordinates from localStorage.
 * Returns { lat, lng } or null if not available or older than 30 minutes.
 */
export function getClientCoords() {
  try {
    const AGE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
    const savedAt = parseInt(localStorage.getItem('frambit_client_coords_at') || '0', 10);
    if (Date.now() - savedAt > AGE_LIMIT_MS) return null; // expired
    const lat = parseFloat(localStorage.getItem('frambit_client_lat'));
    const lng = parseFloat(localStorage.getItem('frambit_client_lng'));
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  } catch (e) {}
  return null;
}

/**
 * Computes distance_km for a creator object given client coords.
 * Uses GPS coords if available on the creator, otherwise looks up by city name.
 * Returns null if no coords can be resolved.
 */
export function computeCreatorDistance(creator, clientLat, clientLng) {
  if (clientLat == null || clientLng == null) return null;

  // Prefer GPS coords stored on creator
  if (creator.lat != null && creator.lng != null) {
    const lat = parseFloat(creator.lat);
    const lng = parseFloat(creator.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return parseFloat(haversineKm(clientLat, clientLng, lat, lng).toFixed(1));
    }
  }

  // Fall back to city name lookup
  const cityName = creator.city || creator.location || '';
  const coords = getCityCoords(cityName);
  if (coords) {
    return parseFloat(haversineKm(clientLat, clientLng, coords[0], coords[1]).toFixed(1));
  }

  return null;
}
