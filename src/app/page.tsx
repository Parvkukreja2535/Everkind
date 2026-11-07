import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock, KeyRound, PoundSterling, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { CoverageChecker } from "@/components/CoverageChecker";
import { CATEGORIES, LISTED_SERVICES, getService, servicesIn, AVAILABILITY, formatPence } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

const FEATURED = ["instant-clean", "short-let-turnover-1-bedroom", "womens-haircut-trim", "manicure", "mens-haircut", "haircut-and-beard-trim", "furniture-assembly", "picture-mirror-shelf-hanging"];

export default function Home() {
  const featured = FEATURED.map((s) => getService(s)!).filter(Boolean);
  const instant = getService("instant-clean")!;
  return (
    <>
      {/* Hero */}
      <section>
        <div className="wrap grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <p className="eyebrow">Home &amp; personal services · Central London</p>
            <h1 className="display mt-4 text-[clamp(40px,5.6vw,66px)] leading-[1.06]">Everything your home needs. One place.</h1>
            <p className="mt-5 max-w-[520px] text-lg text-text-muted">From everyday cleaning to home maintenance, beauty and beyond, discover services designed around your life.</p>
            <form action="/services" className="mt-8 flex max-w-[540px] gap-2 rounded-[14px] border border-line bg-white p-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]" role="search">
              <label htmlFor="q-home" className="sr-only">Search services</label>
              <input id="q-home" name="q" placeholder="What do you need? e.g. haircut, shelves, cleaning" className="min-w-0 flex-1 bg-transparent px-3 outline-none" />
              <button className="btn-primary" type="submit">Find services</button>
            </form>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
              <li className="inline-flex items-center gap-1.5"><Clock size={16} className="text-green" aria-hidden="true" />Open {SITE.hours}</li>
              <li className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-green" aria-hidden="true" />Vetted, insured professionals</li>
              <li className="inline-flex items-center gap-1.5"><PoundSterling size={16} className="text-green" aria-hidden="true" />No payment taken online</li>
            </ul>
            <p className="mt-6"><Link href="/services" className="link">Explore all services →</Link></p>
          </div>
          <div className="relative aspect-[10/11] max-w-full overflow-hidden rounded-[18px] bg-surface">
            <Image src="/images/services/1600210492486-724fe5c67fb0.jpg" alt="A bright, tidy living room with a sofa and plants" fill priority sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Instant Clean band */}
      <section className="bg-ink text-white" aria-labelledby="ic-h">
        <div className="wrap grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_.9fr_1fr]">
          <div>
            <p className="eyebrow text-green-accent">Instant Clean</p>
            <h2 id="ic-h" className="mt-3 font-display text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.12]">Guests this evening and no time to tidy? We'll come to you.</h2>
            <p className="mt-4 max-w-[560px] text-[#CCCCCC]">Book an equipped Everkind cleaner by the hour. Pick the chores that matter most and we'll work through them in your order of priority.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/services/cleaning/instant-clean" className="btn-accent btn-lg">Book Instant Clean</Link>
              <Link href="/services/cleaning/instant-clean#included" className="btn-ghost-dark btn-lg">What's included</Link>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[14px] lg:block">
            <Image src="/images/services/1527515637462-cff94eecc1ac.jpg" alt="Vacuuming confetti off a carpet after a party" fill sizes="400px" className="object-cover" />
          </div>
          <ul className="grid gap-3">
            {[
              [Clock, "Estimated arrival shown after booking", "Based on which cleaners are on duty nearby. Estimates may change."],
              [PoundSterling, `${formatPence(instant.pricePence!)} per hour, 1-hour minimum`, "See your total before you confirm. Extra time only with your approval."],
              [Sparkles, "Everyday chores, fully equipped", "Tidying, dishes, kitchen, bathroom, floors, dusting, beds and bins."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof Clock;
              return (
                <li key={title as string} className="flex gap-3 border-t border-green-accent/45 pt-3">
                  <I size={20} className="mt-1 shrink-0 text-green-accent" aria-hidden="true" />
                  <div><b>{title as string}</b><br /><span className="text-[#CCCCCC]">{body as string}</span></div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Available now */}
      <section className="py-20 lg:py-24">
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Available now</p>
              <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Book today in central London</h2>
              <p className="mt-2 max-w-[560px] text-text-muted">Everkind's own team handles cleaning, hair, nails and barbering. Vetted independent professionals handle handyman jobs.</p>
            </div>
            <Link href="/services" className="link">See every service →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => <ServiceCard key={s.slug} service={s} />)}
          </div>
        </div>
      </section>

      {/* Explore all services */}
      <section className="border-y border-line bg-surface py-20 lg:py-24">
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Explore all services</p>
              <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">One place for your whole home</h2>
              <p className="mt-2 max-w-[560px] text-text-muted">See what's available now and what's on the way. Register your interest and we'll let you know when a service launches near you.</p>
            </div>
            <Link href="/services" className="btn-primary">Explore all services</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const list = servicesIn(c.slug);
              const now = list.filter((s) => s.availability === "available_now").length;
              return (
                <Link key={c.slug} href={`/services/${c.slug}`} className="card flex items-center gap-4 p-3 transition hover:-translate-y-0.5 hover:border-green">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"><Image src={list[0].image} alt="" fill sizes="56px" className="object-cover" /></span>
                  <span>
                    <span className="font-semibold">{c.name}</span><br />
                    <span className="text-[13px] text-text-muted">{list.length} service{list.length > 1 ? "s" : ""} · {now ? `${now} available now` : AVAILABILITY[list[0].availability].label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-text-muted">{LISTED_SERVICES.length} services across {CATEGORIES.length} categories.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-24" id="how">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Simple to book. Clear at every step.</h2>
          <ol className="mt-9 grid gap-8 md:grid-cols-3">
            {[
              ["Choose a service", "Check your postcode, pick a service and see the price and what's included."],
              ["Send your booking", "Tell us when and where. No payment is taken online."],
              ["We confirm and arrive", "You'll get a confirmation email and an estimated arrival time or window."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t border-green-accent pt-4">
                <span className="font-display text-3xl text-green">{i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-[15px] text-text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-5 rounded-card border border-line bg-white p-6 text-[15px] md:grid-cols-3">
            <div><b className="block text-green">Everkind team services</b>Cleaning, hair, nails and barbering are carried out by Everkind-employed team members.</div>
            <div><b className="block text-green">Independent professionals</b>Handyman jobs start as a request and are confirmed once a vetted professional accepts.</div>
            <div><b className="block text-green">Instant Clean</b>An on-duty cleaner is assigned and you're sent an estimated arrival time.</div>
          </div>
        </div>
      </section>

      {/* Branded team + trust */}
      <section className="pb-20 lg:pb-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <figure className="relative aspect-[3/4] overflow-hidden rounded-card">
              <Image src="/images/brand/everkind-team-member.jpg" alt="Illustration: a cleaner wearing an Everkind T-shirt" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
            </figure>
            <figure className="relative mt-10 aspect-[3/4] overflow-hidden rounded-card">
              <Image src="/images/brand/everkind-van.jpg" alt="Illustration: a van with Everkind branding" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
            </figure>
            <figcaption className="col-span-2 text-xs text-text-muted">Illustrative images showing Everkind uniform and vehicle branding.</figcaption>
          </div>
          <div>
            <p className="eyebrow">Why Everkind</p>
            <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Care you can check</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                [Users, "Our own trained team", "Cleaners, stylists and barbers are employed and trained by Everkind."],
                [ShieldCheck, "Vetted professionals", "Independent professionals pass identity, reference and insurance checks before joining."],
                [CalendarCheck, "Clear prices and scope", "See the price and what's included before you book. Extras need your approval."],
                [KeyRound, "Careful with your home", "Access details are shared only with your assigned professional."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Users;
                return (
                  <li key={t as string}>
                    <I size={26} className="text-green" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold">{t as string}</h3>
                    <p className="mt-1 text-[15px] text-text-muted">{d as string}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Hosts */}
      <section className="bg-surface">
        <div className="wrap grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow">For hosts &amp; property managers</p>
            <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Turnovers handled between every stay</h2>
            <p className="mt-4 max-w-[520px] text-text-muted">Book turnover cleans for each of your properties, with a photo checklist when the clean is done. Business accounts for managing several properties are on the way.</p>
            <Link href="/for-hosts" className="btn-primary mt-6">Hosting with Everkind</Link>
          </div>
          <div className="card px-6 py-2">
            {servicesIn("cleaning").filter((s) => s.slug.startsWith("short-let")).map((s) => (
              <Link key={s.slug} href={`/services/cleaning/${s.slug}`} className="flex justify-between gap-3 border-b border-line py-4 last:border-0 hover:text-green">
                <span>{s.name.replace("Short-let / Airbnb turnover clean – ", "Turnover clean · ")}</span>
                <span className="font-semibold tabular-nums">{formatPence(s.pricePence!)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-20">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Areas we cover</p>
            <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Central London, within 6 miles of the City</h2>
            <p className="mt-4 text-text-muted">We're starting close to home so our team can reach you reliably. Check your postcode to see if we cover you.</p>
          </div>
          <CoverageChecker />
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24">
        <div className="wrap max-w-[860px]">
          <p className="eyebrow">Questions</p>
          <h2 className="display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight">Good to know</h2>
          <div className="mt-6">
            {[
              ["Do I pay online?", SITE.noPayment],
              ["How accurate are arrival times?", "Arrival times are estimates based on the schedule and typical travel time. They may change, and we'll update you if they do. We don't track professionals' locations."],
              ["What hours do you work?", `All services run ${SITE.hours}. Bookings must finish by 8:00pm.`],
              ["Can I cancel?", `${SITE.cancellation} After that, a fee may apply in future; for now no payment is taken.`],
              ["Why can't I book some services yet?", "Some services are coming soon or planned. Others, like gas work, electrical work and childcare, need specific registrations and approvals first. You can register your interest on each service page."],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none justify-between gap-3 text-[17px] font-semibold">{q}<span className="text-xl text-green group-open:rotate-45 transition">+</span></summary>
                <p className="mt-3 max-w-[720px] text-text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
