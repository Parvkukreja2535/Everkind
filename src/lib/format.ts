export const money = (pence: number | null | undefined) => (pence == null ? "—" : `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`);
export const dateLong = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
export const dateTime = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
export const timeShort = (t: string | null) => (t ? t.slice(0, 5) : "As soon as possible");
export const fullName = (p: { first_name?: string | null; last_name?: string | null }) => [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
