import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap py-24 text-center">
      <h1 className="display text-4xl">We couldn't find that page</h1>
      <p className="mt-3 text-text-muted">The link may be out of date.</p>
      <Link href="/services" className="btn-primary mt-6">Explore all services</Link>
    </div>
  );
}
