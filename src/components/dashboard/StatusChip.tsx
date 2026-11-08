const BOOKING: Record<string, [string, string]> = {
  requested: ["Booking received", "bg-[#E3ECF1] text-status-info"],
  finding_professional: ["Finding a professional", "bg-[#E3ECF1] text-status-info"],
  escalated: ["Needs attention", "bg-amber-tint text-status-warn"],
  confirmed: ["Confirmed", "bg-green-tint text-status-ok"],
  on_the_way: ["On the way", "bg-green text-white"],
  arrived: ["Arrived", "bg-green text-white"],
  in_progress: ["In progress", "bg-green text-white"],
  completed: ["Completed", "bg-surface text-text border border-line"],
  cancelled_by_customer: ["Cancelled", "bg-surface text-text-muted border border-line"],
  cancelled_by_everkind: ["Cancelled by Everkind", "bg-surface text-text-muted border border-line"],
  not_fulfilled: ["Not fulfilled", "bg-surface text-text-muted border border-line"],
};
const APPLICATION: Record<string, [string, string]> = {
  submitted: ["Submitted", "bg-[#E3ECF1] text-status-info"],
  under_review: ["Under review", "bg-[#E3ECF1] text-status-info"],
  info_required: ["Additional information required", "bg-amber-tint text-status-warn"],
  approved: ["Approved", "bg-green-tint text-status-ok"],
  rejected: ["Rejected", "bg-surface text-text-muted border border-line"],
};

export const bookingStatusLabel = (s: string) => BOOKING[s]?.[0] ?? s;
export const applicationStatusLabel = (s: string) => APPLICATION[s]?.[0] ?? s;

export function StatusChip({ status, kind = "booking" }: { status: string; kind?: "booking" | "application" | "account" }) {
  const map = kind === "application" ? APPLICATION : kind === "account" ? { active: ["Active", "bg-green-tint text-status-ok"], suspended: ["Suspended", "bg-[#F8E6E3] text-status-err"] } as Record<string, [string, string]> : BOOKING;
  const [label, cls] = map[status] ?? [status, "bg-surface text-text-muted"];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export const UPCOMING = ["requested", "finding_professional", "escalated", "confirmed", "on_the_way", "arrived", "in_progress"];
export const CANCELLED = ["cancelled_by_customer", "cancelled_by_everkind", "not_fulfilled"];
