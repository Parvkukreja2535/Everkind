import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock, KeyRound, PoundSterling, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { CoverageChecker } from "@/components/CoverageChecker";
import { Reveal } from "@/components/motion/Reveal";
import { Crossfade, type Slide } from "@/components/motion/Crossfade";
import { Parallax } from "@/components/motion/Parallax";
import { AVAILABILITY, formatPence } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/catalogue-data";
import { SITE } from "@/lib/site";

const FEATURED = ["instant-clean", "short-let-turnover-1-bedroom", "womens-haircut-trim", "manicure", "mens-haircut", "haircut-and-beard-trim", "furniture-assembly", "picture-mirror-shelf-hanging"];

// Hero photography (Unsplash License; see public/images/home/CREDITS.md).
const HERO_SLIDES: Slide[] = [
  { src: "/images/home/hero-living-room.jpg", alt: "A bright, tidy living room with a sofa, plants and framed prints" },
  { src: "/images/home/hero-cleaner.jpg", alt: "A cleaner in gloves wiping a sash window in a period home" },
  { src: "/images/home/hero-blow-dry.jpg", alt: "A stylist giving a blow-dry with a round brush" },
  { src: "/images/home/hero-london.jpg", alt: "London from above at dusk, with the Thames and Tower Bridge" },
  { src: "/images/home/hero-bright-flat.jpg", alt: "A calm, sunlit flat with a sofa, bookshelves and houseplants" },
];

const CTA_SLIDES: Slide[] = [
  { src: "/images/home/cta-interior-1.jpg", alt: "" },
  { src: "/images/home/cta-interior-2.jpg", alt: "" },
];

const H2 = "display mt-2 text-[clamp(30px,3.4vw,42px)] leading-tight";

export default async function Home() {
  const { categories, services } = await getCatalogue();
  const bySlug = (slug: string) => services.find((s) => s.slug === slug);
  const servicesIn = (cat: string) => services.filter((s) => s.category === cat);
  const featured = FEATURED.map(bySlug).filter((s): s is NonNullable<typeof s> => !!s && s.availability === "available_now");
  const instant = bySlug("instant-clean");
  return (
    <>
      {/* Hero */}
      <section>
        <div className="wrap grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <p className="eyebrow hero-rise">Home &amp; personal services · Central London</p>
            <h1 className="display hero-rise mt-4 text-[clamp(40px,5.6vw,66px)] leading-[1.06]" style={{ "--hero-delay": "80ms" } as React.CSSProperties}>Everything your home needs. One place.</h1>
            <p className="hero-rise mt-5 max-w-[520px] text-lg text-text-muted" style={{ "--hero-delay": "180ms" } as React.CSSProperties}>From everyday cleaning to home maintenance, beauty and beyond, discover services designed around your life.</p>
            <div className="hero-rise" style={{ "--hero-delay": "280ms" } as React.CSSProperties}>
              <form action="/services" className="mt-8 flex max-w-[540px] gap-2 rounded-[14px] border border-line bg-white p-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] transition-shadow focus-within:shadow-[0_14px_36px_-18px_rgba(0,132,42,0.45)]" role="search">
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
          </div>
          <div className="hero-settle relative aspect-[10/11] max-w-full overflow-hidden rounded-[18px] bg-surface">
            <Crossfade slides={HERO_SLIDES} sizes="(min-width:1024px) 540px, 100vw" priority showControls label="Everkind homes and services" />
          </div>
        </div>
      </section>

      {/* Instant Clean band */}
      <section className="relative overflow-hidden bg-ink text-white" aria-labelledby="ic-h">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-green-accent/10 blur-3xl" />
        <div className="wrap relative grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <Reveal as="p" className="eyebrow text-green-accent">Instant Clean</Reveal>
            <Reveal as="h2" delay={80} id="ic-h" className="mt-3 font-display text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.12]">Guests this evening and no time to tidy? We'll come to you.</Reveal>
            <Reveal as="p" delay={160} className="mt-4 max-w-[560px] text-[#CCCCCC]">Book an equipped Everkind cleaner by the hour. Pick the chores that matter most and we'll work through them in your order of priority.</Reveal>
            <Reveal delay={240} className="mt-7 flex flex-wrap gap-3">
              <Link href="/services/cleaning/instant-clean" className="btn-accent btn-lg px-8 text-[17px] shadow-[0_14px_30px_-16px_rgba(0,168,45,0.8)]">Book Instant Clean</Link>
              <Link href="/services/cleaning/instant-clean#included" className="btn-ghost-dark btn-lg">What's included</Link>
            </Reveal>
            <ul className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                [Clock, "Estimated arrival shown after booking", "Based on which cleaners are on duty nearby. Estimates may change."],
                [PoundSterling, instant?.pricePence != null ? `${formatPence(instant.pricePence)} per hour, ${instant.minHours ?? 1}-hour minimum` : "Billed by the hour, 1-hour minimum", "See your total before you confirm. Extra time only with your approval."],
                [Sparkles, "Everyday chores, fully equipped", "Tidying, dishes, kitchen, bathroom, floors, dusting, beds and bins."],
              ].map(([Icon, title, body], i) => {
                const I = Icon as typeof Clock;
                return (
                  <Reveal as="li" delay={320 + i * 90} key={title as string} className="flex gap-3 border-t border-green-accent/45 pt-3 text-[15px]">
                    <I size={20} className="mt-1 shrink-0 text-green-accent" aria-hidden="true" />
                    <div><b>{title as string}</b><br /><span className="text-[#CCCCCC]">{body as string}</span></div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
          <Reveal variant="image" delay={120} className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] lg:aspect-[4/5] lg:max-h-[620px]">
            <Image src="/images/home/instant-confetti.jpg" alt="Vacuuming confetti off a carpet after a party" fill sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Available now */}
      <section className="py-20 lg:py-24">
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Available now</p>
              <h2 className={H2}>Book today in central London</h2>
              <p className="mt-2 max-w-[560px] text-text-muted">Everkind's own team handles cleaning, hair, nails and barbering. Vetted independent professionals handle handyman jobs.</p>
            </Reveal>
            <Reveal delay={120}><Link href="/services" className="link">See every service →</Link></Reveal>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 4) * 90} className="flex [&>*]:w-full"><ServiceCard service={s} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Explore all services */}
      <section className="border-y border-line bg-surface py-20 lg:py-24">
        <div className="wrap">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Explore all services</p>
              <h2 className={H2}>One place for your whole home</h2>
              <p className="mt-2 max-w-[560px] text-text-muted">See what's available now and what's on the way. Register your interest and we'll let you know when a service launches near you.</p>
            </Reveal>
            <Reveal delay={120}><Link href="/services" className="btn-primary">Explore all services</Link></Reveal>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => {
              const list = servicesIn(c.slug);
              if (!list.length) return null;
              const now = list.filter((s) => s.availability === "available_now").length;
              return (
                <Reveal key={c.slug} delay={(i % 4) * 70}>
                  <Link href={`/services/${c.slug}`} className="card group flex h-full items-center gap-4 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-green hover:shadow-[0_14px_30px_-22px_rgba(0,0,0,0.45)]">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"><Image src={c.imageUrl || list[0].image} alt="" fill sizes="56px" className="object-cover transition duration-700 ease-out group-hover:scale-110" /></span>
                    <span>
                      <span className="font-semibold">{c.name}</span><br />
                      <span className="text-[13px] text-text-muted">{list.length} service{list.length > 1 ? "s" : ""} · {now ? `${now} available now` : AVAILABILITY[list[0].availability].label}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <Reveal as="p" className="mt-6 text-sm text-text-muted">{services.length} services across {categories.length} categories.</Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-24" id="how">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className={H2}>Simple to book. Clear at every step.</h2>
          </Reveal>
          <ol className="mt-9 grid gap-8 md:grid-cols-3">
            {[
              ["Choose a service", "Check your postcode, pick a service and see the price and what's included."],
              ["Send your booking", "Tell us when and where. No payment is taken online."],
              ["We confirm and arrive", "You'll get a confirmation email and an estimated arrival time or window."],
            ].map(([t, d], i) => (
              <li key={t} className="relative pt-4">
                <Reveal variant="line" delay={i * 220} className="absolute inset-x-0 top-0 h-px bg-green-accent" aria-hidden="true" />
                <Reveal delay={120 + i * 220}>
                  <span className="font-display text-3xl text-green">{i + 1}</span>
                  <h3 className="mt-1 text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-[15px] text-text-muted">{d}</p>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal delay={200} className="mt-8 grid gap-5 rounded-card border border-line bg-white p-6 text-[15px] md:grid-cols-3">
            <div><b className="block text-green">Everkind team services</b>Cleaning, hair, nails and barbering are carried out by Everkind-employed team members.</div>
            <div><b className="block text-green">Independent professionals</b>Handyman jobs start as a request and are confirmed once a vetted professional accepts.</div>
            <div><b className="block text-green">Instant Clean</b>An on-duty cleaner is assigned and you're sent an estimated arrival time.</div>
          </Reveal>
        </div>
      </section>

      {/* Branded team + trust */}
      <section className="pb-20 lg:pb-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <Reveal as="figure" variant="image" className="relative aspect-[3/4] overflow-hidden rounded-card">
              <Image src="/images/brand/everkind-team-member.jpg" alt="Illustration: a cleaner wearing an Everkind T-shirt" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
            </Reveal>
            <Reveal as="figure" variant="image" delay={160} className="relative mt-10 aspect-[3/4] overflow-hidden rounded-card">
              <Image src="/images/brand/everkind-van.jpg" alt="Illustration: a van with Everkind branding" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
            </Reveal>
            <figcaption className="col-span-2 text-xs text-text-muted">Illustrative images showing Everkind uniform and vehicle branding.</figcaption>
          </div>
          <div>
            <Reveal>
              <p className="eyebrow">Why Everkind</p>
              <h2 className={H2}>Care you can check</h2>
            </Reveal>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                [Users, "Our own trained team", "Cleaners, stylists and barbers are employed and trained by Everkind."],
                [ShieldCheck, "Vetted professionals", "Independent professionals pass identity, reference and insurance checks before joining."],
                [CalendarCheck, "Clear prices and scope", "See the price and what's included before you book. Extras need your approval."],
                [KeyRound, "Careful with your home", "Access details are shared only with your assigned professional."],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof Users;
                return (
                  <Reveal as="li" key={t as string} delay={i * 100}>
                    <I size={26} className="text-green" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold">{t as string}</h3>
                    <p className="mt-1 text-[15px] text-text-muted">{d as string}</p>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Hosts */}
      <section className="bg-surface">
        <div className="wrap grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <Reveal variant="image" className="aspect-[4/3] w-full overflow-hidden rounded-[18px]">
            <Parallax className="h-full w-full" strength={24}>
              <Image src="/images/home/hosts-lounge.jpg" alt="A warm, styled lounge ready for guests" fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" />
            </Parallax>
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">For hosts &amp; property managers</p>
              <h2 className={H2}>Turnovers handled between every stay</h2>
              <p className="mt-4 max-w-[520px] text-text-muted">Book turnover cleans for each of your properties, with a photo checklist when the clean is done. Business accounts for managing several properties are on the way.</p>
            </Reveal>
            <Reveal delay={140} className="card mt-7 px-6 py-2">
              {servicesIn("cleaning").filter((s) => s.slug.startsWith("short-let")).map((s) => (
                <Link key={s.slug} href={`/services/cleaning/${s.slug}`} className="flex justify-between gap-3 border-b border-line py-4 transition-colors last:border-0 hover:text-green">
                  <span>{s.name.replace("Short-let / Airbnb turnover clean – ", "Turnover clean · ")}</span>
                  <span className="font-semibold tabular-nums">{formatPence(s.pricePence!)}</span>
                </Link>
              ))}
            </Reveal>
            <Reveal delay={220}><Link href="/for-hosts" className="btn-primary mt-6">Hosting with Everkind</Link></Reveal>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-20">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Areas we cover</p>
            <h2 className={H2}>Central London, within 6 miles of the City</h2>
            <p className="mt-4 text-text-muted">We're starting close to home so our team can reach you reliably. Check your postcode to see if we cover you.</p>
          </Reveal>
          <Reveal delay={120}><CoverageChecker /></Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24">
        <div className="wrap max-w-[860px]">
          <Reveal>
            <p className="eyebrow">Questions</p>
            <h2 className={H2}>Good to know</h2>
          </Reveal>
          <Reveal delay={100} className="mt-6">
            {[
              ["Do I pay online?", SITE.noPayment],
              ["How accurate are arrival times?", "Arrival times are estimates based on the schedule and typical travel time. They may change, and we'll update you if they do. We don't track professionals' locations."],
              ["What hours do you work?", `All services run ${SITE.hours}. Bookings must finish by 8:00pm.`],
              ["Can I cancel?", `${SITE.cancellation} After that, a fee may apply in future; for now no payment is taken.`],
              ["Why can't I book some services yet?", "Some services are coming soon or planned. Others, like gas work, electrical work and childcare, need specific registrations and approvals first. You can register your interest on each service page."],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none justify-between gap-3 text-[17px] font-semibold transition-colors hover:text-green">{q}<span className="text-xl text-green transition-transform duration-300 group-open:rotate-45">+</span></summary>
                <p className="mt-3 max-w-[720px] text-text-muted">{a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final call to action */}
      <section className="relative isolate overflow-hidden bg-ink text-white" aria-labelledby="cta-h">
        <div className="absolute inset-0 -z-10">
          <Crossfade slides={CTA_SLIDES} interval={8000} sizes="100vw" label="Everkind homes" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30" />
        </div>
        <div className="wrap py-24 lg:py-32">
          <Reveal as="p" className="eyebrow text-green-accent">Ready when you are</Reveal>
          <Reveal as="h2" delay={80} id="cta-h" className="mt-3 max-w-[640px] font-display text-[clamp(34px,4.4vw,56px)] font-medium leading-[1.08]">Your home, looked after.</Reveal>
          <Reveal as="p" delay={160} className="mt-4 max-w-[520px] text-lg text-[#E0E0E0]">Book cleaning, hair, nails, barbering or a handyman in central London. No payment is taken online.</Reveal>
          <Reveal delay={240} className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="btn-accent btn-lg px-8 text-[17px] shadow-[0_14px_30px_-16px_rgba(0,168,45,0.8)]">Book a service</Link>
            <Link href="/services/cleaning/instant-clean" className="btn-ghost-dark btn-lg">Book Instant Clean</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
