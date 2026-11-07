import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/ServiceCard";
import { CATEGORIES, getCategory, servicesIn } from "@/lib/catalogue";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = getCategory((await params).category);
  return c ? { title: `${c.name} services`, description: c.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const c = getCategory((await params).category);
  if (!c) notFound();
  const list = servicesIn(c.slug);
  return (
    <div className="wrap pb-24">
      <p className="pt-6 text-sm text-text-muted"><Link href="/" className="hover:text-green">Home</Link> / <Link href="/services" className="hover:text-green">All services</Link> / {c.name}</p>
      <header className="py-10">
        <h1 className="display text-[clamp(36px,4.6vw,54px)] leading-tight">{c.name}</h1>
        <p className="mt-3 max-w-[640px] text-lg text-text-muted">{c.description}</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => <ServiceCard key={s.slug} service={s} />)}
      </div>
    </div>
  );
}
