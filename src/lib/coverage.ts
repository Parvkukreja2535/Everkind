// Service-area check (requirements v1.2 §17): 6-mile radius from the City of London.
// Postcode -> coordinates via postcodes.io (free, open UK postcode data), then a
// straight-line (haversine) distance check. Centre and radius become admin settings
// once the database is connected.

export const COVERAGE = {
  centre: { lat: 51.5155, lng: -0.0922, name: "the City of London" },
  radiusMiles: 6,
};

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function normalisePostcode(input: string) {
  const compact = input.trim().toUpperCase().replace(/\s+/g, "");
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function isValidPostcode(input: string) {
  return UK_POSTCODE.test(input.trim());
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type CoverageResult =
  | { status: "covered"; postcode: string; miles: number; area: string }
  | { status: "outside"; postcode: string; miles: number; area: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export async function checkCoverage(rawPostcode: string, fetcher: typeof fetch = fetch): Promise<CoverageResult> {
  if (!isValidPostcode(rawPostcode)) {
    return { status: "invalid", message: "Enter a full UK postcode, for example EC2V 7HH." };
  }
  const postcode = normalisePostcode(rawPostcode);
  try {
    const res = await fetcher(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (res.status === 404) return { status: "invalid", message: "We couldn't find that postcode. Check it and try again." };
    if (!res.ok) return { status: "error", message: "We couldn't check your postcode just now. Please try again." };
    const data = (await res.json()) as { result?: { latitude: number | null; longitude: number | null; admin_district?: string } };
    const r = data.result;
    if (!r || r.latitude == null || r.longitude == null) {
      return { status: "invalid", message: "We couldn't find a location for that postcode." };
    }
    const miles = milesBetween(COVERAGE.centre, { lat: r.latitude, lng: r.longitude });
    const area = r.admin_district ?? "your area";
    return miles <= COVERAGE.radiusMiles
      ? { status: "covered", postcode, miles, area }
      : { status: "outside", postcode, miles, area };
  } catch {
    return { status: "error", message: "We couldn't check your postcode just now. Please try again." };
  }
}
