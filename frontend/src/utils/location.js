import { saveClientCoords } from './geo.js';

/**
 * Resolves a human-readable city/town name from the BigDataCloud reverse-geocode response.

 *
 * Priority chain (most specific → least specific):
 *   city → locality → county → principalSubdivision (state)
 *
 * This covers rural areas (taluks, small towns like Nadapuram in Kerala) that have
 * no `city` field in the response, but always have at least one of the others.
 */
function resolveCityFromBDC(data) {
  const candidates = [
    data.city,
    data.locality,
    // county is typically the district-level name — reliable for rural India
    data.localityInfo?.administrative?.find(
      (a) => a.adminLevel === 6 || a.adminLevel === 7 || a.order === 6 || a.order === 7
    )?.name,
    data.county,
    data.principalSubdivision,
  ];
  for (const c of candidates) {
    const name = c && typeof c === 'string' ? c.trim() : null;
    if (name && name !== 'India') return name;
  }
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
        console.warn('Geolocation error:', error);
        const ipDetails = await fetchIpLocationDetails();
        resolve(ipDetails);
      },
      { timeout: 6000, enableHighAccuracy: true }
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
