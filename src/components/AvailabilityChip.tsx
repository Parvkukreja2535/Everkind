import { CalendarClock, Check, Clock, ShieldCheck } from "lucide-react";
import { AVAILABILITY, type Availability } from "@/lib/catalogue";

const STYLE: Record<Availability, string> = {
  available_now: "bg-green text-white",
  coming_soon: "bg-green-tint text-green border border-green-soft",
  planned: "bg-white text-text-muted border border-line",
  subject_to_approval: "bg-amber-tint text-status-warn border border-amber-line",
};
const ICON = { available_now: Check, coming_soon: Clock, planned: CalendarClock, subject_to_approval: ShieldCheck };

export function AvailabilityChip({ availability, className = "" }: { availability: Availability; className?: string }) {
  const Icon = ICON[availability];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[availability]} ${className}`}>
      <Icon size={13} aria-hidden="true" />
      {AVAILABILITY[availability].label}
    </span>
  );
}
