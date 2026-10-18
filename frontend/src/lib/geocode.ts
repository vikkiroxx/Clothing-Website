export interface SearchResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`,
  );

  if (!res.ok) {
    throw new Error("Search failed");
  }

  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

export interface GeocodedAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

// OpenStreetMap's free Nominatim endpoint — fine for light, occasional lookups
// like this one. A high-traffic deployment should proxy/cache this server-side.
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
  );

  if (!res.ok) {
    throw new Error("Could not look up that location");
  }

  const data = await res.json();
  const a = data.address ?? {};

  return {
    line1: [a.house_number, a.road].filter(Boolean).join(" ") || a.suburb || a.neighbourhood || "",
    city: a.city || a.town || a.village || a.county || "",
    state: a.state || "",
    pincode: a.postcode || "",
  };
}
