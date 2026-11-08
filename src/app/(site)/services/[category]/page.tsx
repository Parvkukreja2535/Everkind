import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/ServiceCard";
import { getCatalogue, getCategoryBySlug } from "@/lib/catalogue-data";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).category);
  return c ? { title: `${c.name} services`, description: c.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const slug = (await params).category;
  const { categories, services } = await getCatalogue();
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const list = services.filter((s) => s.category === c.slug);
  return (
    <div className="wrap pb-24">
      <p className="pt-6 text-sm text-text-muted"><Link href="/" className="hover:text-green">Home</Link> / <Link href="/services" className="hover:text-green">All services</Link> / {c.name}</p>
      <header className="py-10">
        <h1 className="display text-[clamp(36px,4.6vw,54px)] leading-tight">{c.name}</h1>
        <p className="mt-3 max-w-[640px] text-lg text-text-muted">{c.description}</p>
      </header>
      {list.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <ServiceCard key={s.slug} service={s} />)}</div>
      ) : <p className="text-text-muted">There are no services in this category yet.</p>}
    </div>
  );
}
