import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label="Everkind home" className={`inline-flex items-center gap-2 font-display text-[26px] font-medium tracking-[0.01em] ${dark ? "text-white" : "text-green"}`}>
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="#00A82D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l9-7 9 7" />
        <path d="M12 20c-3.5-1.5-5-4-5-7 3 0 5 2 5 5 0-3 2-5 5-5 0 3-1.5 5.5-5 7z" />
      </svg>
      <span>Everkind</span>
    </Link>
  );
}
