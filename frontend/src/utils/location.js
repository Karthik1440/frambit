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
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.city || data.principalSubdivision || 'Bengaluru';

            // Find specific locality or sub-locality from administrative or informative info
            let area = data.locality;
            if (!area || area === city) {
              const adminList = data.localityInfo?.administrative || [];
              const subLoc = adminList.find(
                (item) => item.name && item.name !== city && item.name !== 'India' && item.name !== data.principalSubdivision
              );
              if (subLoc) {
                area = subLoc.name.replace(/ (taluk|district|City Corporation|Metropolitan Region Development Authority)$/i, '');
              }
            }

            if (!area || area === city) {
              area = 'Indiranagar';
            }

            resolve({ city, area, postcode: data.postcode });
            return;
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
      if (data.city) {
        return {
          city: data.city,
          area: data.region || 'Central Area',
        };
      }
    }
  } catch (err) {
    console.warn('IP location fetch error:', err);
  }
  return { city: 'Bengaluru', area: 'Indiranagar' };
}
