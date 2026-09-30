import { saveClientCoords } from './geo.js';

// Suffixes that indicate an administrative organization, not a place name.
// We strip or skip entries containing these.
const ADMIN_JUNK_RE = /\b(district|authority|region|corporation|metropolitan|development|board|council|zonal|railway|zone|taluk|tehsil|mandal|division|urban agglomeration)\b/i;

/**
 * Resolves a human-readable city/town name from the BigDataCloud reverse-geocode response.
 *
 * Strategy:
 *  1. data.city — most reliable for cities/towns
 *  2. data.locality — reliable for smaller towns (e.g. Nadapuram)
 *  3. Walk administrative[] sorted by `order` descending (most specific first),
 *     skip entries with administrative jargon, skip country/state level
 *  4. data.principalSubdivision — state as last resort
 */
function resolveCityFromBDC(data) {
  // 1. Direct city field
  if (data.city && data.city.trim() && data.city.trim() !== 'India') {
    return data.city.trim();
  }

  // 2. Locality (reliable for taluks and small towns)
  if (data.locality && data.locality.trim() && data.locality.trim() !== 'India') {
    return data.locality.trim();
  }

  // 3. Walk administrative list from most specific (highest order) to least specific
  const adminList = data.localityInfo?.administrative || [];
  const sorted = [...adminList].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  const stateName = data.principalSubdivision || '';

  for (const entry of sorted) {
    const name = entry.name && entry.name.trim();
    if (!name) continue;
    if (name === 'India' || name === stateName) continue;          // skip country/state
    if (entry.adminLevel <= 4) continue;                           // skip country/state level
    if (ADMIN_JUNK_RE.test(name)) continue;                        // skip org/admin names
    return name;
  }

  // 4. State name as absolute last resort
  if (stateName && stateName !== 'India') return stateName;

  return null;
}


/**
 * Resolves a human-readable sub-area / neighbourhood from the BigDataCloud response.
 * Returns null if nothing meaningful is found — never hardcodes a city name.
 */
function resolveAreaFromBDC(data, city) {
  // Try the locality first if it differs from what we picked as city
  if (data.locality && data.locality.trim() && data.locality.trim() !== city) {
    return data.locality.trim();
  }

  // Walk the administrative hierarchy for a level more specific than the city
  const adminList = data.localityInfo?.administrative || [];
  // Sorted ascending so we find the most-specific entry first
  const sorted = [...adminList].sort((a, b) => (b.adminLevel ?? b.order ?? 0) - (a.adminLevel ?? a.order ?? 0));
  for (const item of sorted) {
    const name = item.name && item.name.trim();
    if (
      name &&
      name !== city &&
      name !== 'India' &&
      name !== data.principalSubdivision &&
      name !== data.countryName
    ) {
      // Strip generic administrative suffixes
      return name.replace(
        / (taluk|tehsil|district|mandal|City Corporation|Metropolitan Region Development Authority|Municipal Council|Gram Panchayat)$/i,
        ''
      ).trim();
    }
  }

  // Try informative localities (roads, suburbs, etc.)
  const infoList = data.localityInfo?.informative || [];
  for (const item of infoList) {
    const name = item.name && item.name.trim();
    if (name && name !== city && name !== 'India') return name;
  }

  return null;
}

export async function detectCurrentCity() {
  const details = await detectCurrentLocationDetails();
  return details.city;
}

export async function detectCurrentLocationDetails() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      fetchIpLocationDetails().then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Persist raw GPS coords for distance calculations
          saveClientCoords(latitude, longitude);
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = resolveCityFromBDC(data);
            const area = city ? resolveAreaFromBDC(data, city) : null;

            if (city) {
              resolve({ city, area: area || null, postcode: data.postcode || null, lat: latitude, lng: longitude });
              return;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }
        const ipDetails = await fetchIpLocationDetails();
        resolve(ipDetails);
      },
      async (error) => {
        // GeolocationPositionError codes:
        // 1 = PERMISSION_DENIED  — user said no, silent fallback is correct
        // 2 = POSITION_UNAVAILABLE — device has no GPS signal
        // 3 = TIMEOUT — took longer than timeout ms
        if (error.code === 1) {
          // Silently fall back to IP — permission denied is expected on many devices
        } else {
          console.debug(`[Location] GPS unavailable (code ${error.code}: ${error.message}) — falling back to IP`);
        }
        const ipDetails = await fetchIpLocationDetails();
        resolve(ipDetails);
      },
      { timeout: 8000, enableHighAccuracy: false } // lowAccuracy = faster fix, fewer timeouts

    );
  });
}

async function fetchIpLocationDetails() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      // ipapi returns lat/lng directly — use them if available
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      const city = (data.city && data.city.trim()) || (data.region && data.region.trim()) || null;
      if (city) {
        // Save coords from IP API (less precise than GPS but usable for distance sorting)
        if (!isNaN(lat) && !isNaN(lng)) {
          saveClientCoords(lat, lng);
        } else {
          // Fall back to static city lookup
          const { getCityCoords } = await import('./geo.js');
          const coords = getCityCoords(city);
          if (coords) saveClientCoords(coords[0], coords[1]);
        }
        return {
          city,
          area: (data.region && data.region.trim() !== city ? data.region.trim() : null),
        };
      }
    }
  } catch (err) {
    console.warn('IP location fetch error:', err);
  }
  // Last resort: return null so callers can decide their own fallback
  return { city: null, area: null };
}
