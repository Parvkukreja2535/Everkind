export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <header className="py-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(36px,4.6vw,54px)] leading-tight">{title}</h1>
      {intro && <p className="mt-4 max-w-[680px] text-lg text-text-muted">{intro}</p>}
    </header>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[720px] space-y-4 pb-24 text-[16.5px] leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>;
}
