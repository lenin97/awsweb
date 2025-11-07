// lib/getGeoLocation.ts
export async function getCityCountryFromIp(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return 'unknown';
    const data = await res.json();
    return [data.city, data.country_name].filter(Boolean).join(', ') || 'unknown';
  } catch {
    return 'unknown';
  }
}
