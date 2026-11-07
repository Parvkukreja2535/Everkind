// Everkind service catalogue.
// Source of truth: Everkind_London_Investor_Business_Model_Final.xlsx, "Service Catalogue" sheet
// (44 rows, kept with their original phase), plus Instant Clean (row 45, Everkind addition).
// Prices are customer-facing amounts in pence, incl. VAT where applicable (requirements §2, §8).
// When Supabase is connected this data seeds the `services` table; pages read from one place.

export type Availability = "available_now" | "coming_soon" | "planned" | "subject_to_approval";
export type Workforce = "employed" | "contractor" | "regulated";
export type PriceType = "fixed" | "hourly" | "first_hour" | "from" | "callout" | "not_priced";

export interface Category {
  slug: string;
  name: string;
  workbookName: string;
  description: string;
}

export interface ServiceOption {
  slug: string;
  name: string;
  description: string;
  workbookRow: number;
  pricePence: number;
  priceType: PriceType;
  priceNote: string;
}

export interface Service {
  workbookRow: number;
  slug: string;
  category: string;
  name: string;
  availability: Availability;
  workforce: Workforce;
  workbookPhase: string;
  pricePence: number | null;
  priceType: PriceType;
  priceNote: string;
  summary: string;
  included: string[];
  excluded: string[];
  checks: string;
  image: string;
  /** Rows shown only as an option inside another service (flat-pack). */
  optionOf?: string;
  options?: ServiceOption[];
  everkindAddition?: boolean;
  keywords?: string[];
}

export const CATEGORIES: Category[] = [
  { slug: "cleaning", name: "Cleaning", workbookName: "Cleaning", description: "Short-let turnovers and everyday help from Everkind's own trained cleaning team. Deep and end-of-tenancy cleans are coming soon." },
  { slug: "beauty", name: "Beauty", workbookName: "Beauty", description: "Hair, nails and treatments at home from Everkind's employed salon team." },
  { slug: "barbering", name: "Barbering", workbookName: "Barbering", description: "Cuts and beard work at home by Everkind barbers." },
  { slug: "wellness", name: "Wellness", workbookName: "Wellness", description: "Massage by independent, qualified and insured therapists." },
  { slug: "handyman", name: "Handyman", workbookName: "Handyman", description: "Fixed-scope jobs around the home by vetted independent professionals." },
  { slug: "plumbing", name: "Plumbing", workbookName: "Plumbing", description: "Common plumbing repairs, with a written quote before work begins." },
  { slug: "electrical", name: "Electrical", workbookName: "Electrical", description: "Electrical work by qualified electricians only, once the required approvals are in place." },
  { slug: "gas-services", name: "Gas services", workbookName: "Gas", description: "Gas work may only be carried out by Gas Safe registered businesses and engineers." },
  { slug: "appliance-repair", name: "Appliance repair", workbookName: "Appliance repair", description: "Diagnosis for household appliances, with parts and repairs quoted first." },
  { slug: "air-conditioning", name: "Air conditioning", workbookName: "Air conditioning", description: "Servicing by F-Gas certified specialists." },
  { slug: "pest-control", name: "Pest control", workbookName: "Pest control", description: "Inspection and treatment by trained specialists." },
  { slug: "painting-decorating", name: "Painting & decorating", workbookName: "Painting", description: "Room painting with a survey and a written scope." },
  { slug: "pet-care", name: "Pet care", workbookName: "Pet care", description: "Walks, visits and sitting by insured pet-care providers." },
  { slug: "childcare", name: "Childcare", workbookName: "Childcare", description: "Childcare needs safeguarding checks and a registration review before it can be offered." },
];

const img = (id: string) => `/images/services/${id}.jpg`;

const SHORT_LET_INCLUDED = [
  "Kitchen reset: worktops, hob, sink and appliance fronts",
  "Bathroom clean: toilet, basin, shower or bath, mirrors",
  "Vacuuming and mopping throughout",
  "Beds made with your linen; towels laid out",
  "Bins emptied and rubbish taken out",
  "Photo checklist sent to you when the clean is done",
];
const SHORT_LET_EXCLUDED = [
  "Laundry of linen and towels (Laundry / linen changeover is coming soon)",
  "Extra bathrooms or heavy soiling (priced separately)",
  "Oven, inside fridge and window cleaning",
];
const SHORT_LET_CHECKS = "ID and right-to-work checks, references, training, key custody, property checklist, photo QA, employers' and public liability insurance.";

export const INSTANT_CLEAN_TASKS = [
  "General tidying",
  "Washing dishes, including loading and unloading the dishwasher",
  "Kitchen cleaning: accessible surfaces, worktops, hob and sink",
  "Bathroom cleaning: toilets, sinks, taps, mirrors, showers and baths",
  "Vacuuming and mopping",
  "Dusting accessible furniture and household surfaces",
  "Making beds",
  "Emptying household bins",
];
export const INSTANT_CLEAN_HOURS = [1, 1.5, 2, 3, 4];

export const SERVICES: Service[] = [
  // ---------------- Cleaning ----------------
  { workbookRow: 1, slug: "short-let-turnover-studio", category: "cleaning", name: "Short-let / Airbnb turnover clean – studio", availability: "available_now", workforce: "employed", workbookPhase: "Launch", pricePence: 7500, priceType: "fixed", priceNote: "per turnover", summary: "A standard reset between guests for studio flats, following your property checklist.", included: SHORT_LET_INCLUDED, excluded: SHORT_LET_EXCLUDED, checks: SHORT_LET_CHECKS, image: img("1522708323590-d24dbb6b0267"), keywords: ["airbnb", "turnover", "host", "studio"] },
  { workbookRow: 2, slug: "short-let-turnover-1-bedroom", category: "cleaning", name: "Short-let / Airbnb turnover clean – 1 bedroom", availability: "available_now", workforce: "employed", workbookPhase: "Launch", pricePence: 9500, priceType: "fixed", priceNote: "per turnover", summary: "Turnover clean for one-bedroom short-lets, scheduled between check-out and check-in.", included: SHORT_LET_INCLUDED, excluded: SHORT_LET_EXCLUDED, checks: SHORT_LET_CHECKS, image: img("1631049307264-da0ec9d70304"), keywords: ["airbnb", "turnover", "host"] },
  { workbookRow: 3, slug: "short-let-turnover-2-bedroom", category: "cleaning", name: "Short-let / Airbnb turnover clean – 2 bedroom", availability: "available_now", workforce: "employed", workbookPhase: "Launch", pricePence: 11500, priceType: "fixed", priceNote: "per turnover", summary: "Turnover clean for two-bedroom short-lets. Extra bathrooms or heavy soiling are priced separately.", included: SHORT_LET_INCLUDED, excluded: SHORT_LET_EXCLUDED, checks: SHORT_LET_CHECKS, image: img("1505693416388-ac5ce068fe85"), keywords: ["airbnb", "turnover", "host"] },
  { workbookRow: 4, slug: "short-let-turnover-3-bedroom", category: "cleaning", name: "Short-let / Airbnb turnover clean – 3 bedroom", availability: "available_now", workforce: "employed", workbookPhase: "Launch", pricePence: 14500, priceType: "fixed", priceNote: "per turnover", summary: "Turnover clean for three-bedroom short-lets, with linen handled to your property rules.", included: SHORT_LET_INCLUDED, excluded: SHORT_LET_EXCLUDED, checks: SHORT_LET_CHECKS, image: img("1586023492125-27b2c045efd7"), keywords: ["airbnb", "turnover", "host"] },
  { workbookRow: 45, slug: "instant-clean", category: "cleaning", name: "Instant Clean", availability: "available_now", workforce: "employed", workbookPhase: "Everkind addition (not in workbook)", pricePence: 3500, priceType: "hourly", priceNote: "per hour, 1-hour minimum", summary: "On-demand help with everyday chores. An equipped Everkind cleaner comes to you and works through the tasks you choose.", included: INSTANT_CLEAN_TASKS, excluded: ["Ovens, inside fridges or cupboards", "Windows, carpets or upholstery", "Laundry", "Heavy soiling, mould or biohazards", "Work at height"], checks: "Employed Everkind cleaners with ID and right-to-work checks, references and training. Cleaners bring all products and equipment.", image: img("1581578731548-c64695cc6952"), everkindAddition: true, keywords: ["quick", "same day", "guests", "tidy", "chores", "on demand"] },
  { workbookRow: 5, slug: "regular-domestic-cleaning", category: "cleaning", name: "Regular domestic cleaning", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 2800, priceType: "hourly", priceNote: "per hour, 2-hour minimum", summary: "Recurring home cleaning by the same trained Everkind team.", included: [], excluded: [], checks: "Recurring schedules, paid travel and cancellations included in the labour model.", image: img("1584622650111-993a426fbf0a"), keywords: ["weekly", "fortnightly", "cleaner"] },
  { workbookRow: 6, slug: "deep-cleaning", category: "cleaning", name: "Deep cleaning", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 18000, priceType: "from", priceNote: "property survey and scope required", summary: "A thorough top-to-bottom clean, scoped and priced after a short survey.", included: [], excluded: [], checks: "Checklist, scope exclusions, condition photos and quote approval.", image: img("1584820927498-cfe5211fd8bf") },
  { workbookRow: 7, slug: "end-of-tenancy-cleaning", category: "cleaning", name: "End-of-tenancy cleaning", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 22000, priceType: "from", priceNote: "property size and inventory dependent", summary: "A detailed move-out clean built around your inventory, with a re-clean policy.", included: [], excluded: [], checks: "Written scope, inventory requirements, re-clean policy and team allocation.", image: img("1563453392212-326f5e854473"), keywords: ["move out", "tenancy", "deposit"] },
  { workbookRow: 8, slug: "laundry-linen-changeover", category: "cleaning", name: "Laundry / linen changeover", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 2500, priceType: "fixed", priceNote: "per property or load", summary: "Linen changeover and laundry for short-let properties.", included: [], excluded: [], checks: "Separate price, chain of custody, loss and damage process.", image: img("1517677208171-0bc6725a3e60"), keywords: ["linen", "sheets", "towels"] },
  // ---------------- Beauty ----------------
  { workbookRow: 9, slug: "womens-haircut-trim", category: "beauty", name: "Women's haircut / trim", availability: "available_now", workforce: "employed", workbookPhase: "Launch – limited menu", pricePence: 6500, priceType: "fixed", priceNote: "per appointment", summary: "A cut or trim at home by an Everkind stylist, with a consultation first.", included: ["Consultation on style and hair length", "Wash or wet-down, cut and finish", "Tidy-up of hair clippings afterwards"], excluded: ["Colouring and chemical treatments", "Extensions"], checks: "Qualified, experienced stylist; hygiene process; consultation and patch-test policy where relevant.", image: img("1562322140-8baeececf3df"), keywords: ["hair", "hairdresser", "stylist"] },
  { workbookRow: 10, slug: "blow-dry-styling", category: "beauty", name: "Blow-dry / styling", availability: "available_now", workforce: "employed", workbookPhase: "Launch – limited menu", pricePence: 4500, priceType: "fixed", priceNote: "per appointment", summary: "Blow-dry and styling at home, timed by hair length.", included: ["Blow-dry and styling", "Heat protection products"], excluded: ["Cutting", "Updos for events (see Party / occasion makeup, coming soon)"], checks: "Service time and hair-length bands; portable kit safety.", image: img("1522337360788-8b13dee7a37e"), keywords: ["hair", "blowout"] },
  { workbookRow: 11, slug: "basic-facial", category: "beauty", name: "Basic facial", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 6500, priceType: "fixed", priceNote: "per appointment", summary: "A cleansing, refreshing facial at home with consultation and consent.", included: [], excluded: [], checks: "Training, consent, contraindications, hygiene and treatment liability.", image: img("1570172619644-dfd03ed5d881") },
  { workbookRow: 12, slug: "premium-facial", category: "beauty", name: "Premium facial", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 9000, priceType: "fixed", priceNote: "per appointment", summary: "A longer facial using approved treatments only. No medical claims.", included: [], excluded: [], checks: "Only approved treatments and trained staff; no medical claims.", image: img("1616394584738-fc6e612e71b9") },
  { workbookRow: 13, slug: "waxing", category: "beauty", name: "Waxing – arms / legs / underarms", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 3500, priceType: "from", priceNote: "area-specific menu", summary: "Arms, legs or underarms, with patch testing where needed.", included: [], excluded: [], checks: "Hygiene, consent, patch testing where applicable and treatment insurance.", image: img("1540555700478-4be289fbecef") },
  { workbookRow: 14, slug: "manicure", category: "beauty", name: "Manicure", availability: "available_now", workforce: "employed", workbookPhase: "Launch – limited menu", pricePence: 4000, priceType: "fixed", priceNote: "per appointment", summary: "Shaping, cuticle care and polish at home, with allergy screening.", included: ["Nail shaping and cuticle care", "Hand massage", "Polish of your choice"], excluded: ["Gel polish (coming soon)", "Nail extensions"], checks: "Sanitation, product allergy screening and safe tool handling.", image: img("1604654894610-df63bc536371"), keywords: ["nails"] },
  { workbookRow: 15, slug: "gel-manicure", category: "beauty", name: "Gel manicure", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 4800, priceType: "fixed", priceNote: "per appointment", summary: "Long-lasting gel colour with safe removal guidance.", included: [], excluded: [], checks: "Training, ventilation and product handling, hygiene.", image: img("1519014816548-bf5fe059798b"), keywords: ["nails", "gel"] },
  { workbookRow: 16, slug: "pedicure", category: "beauty", name: "Pedicure", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 4800, priceType: "fixed", priceNote: "per appointment", summary: "Foot care and polish at home. Not a medical foot-care service.", included: [], excluded: [], checks: "Hygiene, contraindication screening; no treatment of medical conditions.", image: img("1519415510236-718bdfcd89c8"), keywords: ["feet", "nails"] },
  { workbookRow: 17, slug: "party-occasion-makeup", category: "beauty", name: "Party / occasion makeup", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 9500, priceType: "fixed", priceNote: "per appointment; travel and time bands", summary: "Makeup for parties and occasions, with early or late appointments by arrangement.", included: [], excluded: [], checks: "Portfolio and experience, hygiene, early or late callout policy.", image: img("1487412947147-5cebf100ffc2"), keywords: ["wedding", "event"] },
  // ---------------- Barbering ----------------
  { workbookRow: 18, slug: "mens-haircut", category: "barbering", name: "Men's haircut", availability: "available_now", workforce: "employed", workbookPhase: "Launch – limited menu", pricePence: 4500, priceType: "fixed", priceNote: "per appointment", summary: "A sharp cut at home by an Everkind barber.", included: ["Consultation", "Clipper and scissor cut", "Neck tidy and finish", "Tidy-up of hair clippings"], excluded: ["Beard work (book Haircut and beard trim)"], checks: "Barber experience, tool sterilisation, travel radius.", image: img("1599351431202-1e0f0137899a"), keywords: ["barber", "hair", "fade"] },
  { workbookRow: 19, slug: "haircut-and-beard-trim", category: "barbering", name: "Haircut and beard trim", availability: "available_now", workforce: "employed", workbookPhase: "Launch – limited menu", pricePence: 5800, priceType: "fixed", priceNote: "per appointment", summary: "Haircut plus beard trim and shaping in one visit.", included: ["Everything in a men's haircut", "Beard trim, shaping and line-up"], excluded: ["Hot-towel wet shave"], checks: "Defined service duration and hygiene process.", image: img("1503951914875-452162b0f3f1"), keywords: ["barber", "beard"] },
  { workbookRow: 20, slug: "beard-trim-shaping", category: "barbering", name: "Beard trim / shaping", availability: "coming_soon", workforce: "employed", workbookPhase: "Phase 2", pricePence: 2800, priceType: "fixed", priceNote: "per appointment", summary: "Beard trim and shaping as a standalone appointment.", included: [], excluded: [], checks: "Tool hygiene and clear minimum booking policy.", image: img("1621605815971-fbc98d665033"), keywords: ["barber", "beard"] },
  // ---------------- Wellness ----------------
  { workbookRow: 21, slug: "swedish-relaxation-massage", category: "wellness", name: "Swedish / relaxation massage", availability: "planned", workforce: "contractor", workbookPhase: "Phase 3", pricePence: 9000, priceType: "fixed", priceNote: "60 minutes", summary: "A 60-minute relaxation massage by an independent, qualified therapist.", included: [], excluded: [], checks: "Verified qualification, treatment insurance, screening, consent and lone-worker safeguards.", image: img("1544161515-4ab6ce6db874"), keywords: ["massage", "spa"] },
  { workbookRow: 22, slug: "deep-tissue-massage", category: "wellness", name: "Deep-tissue massage", availability: "planned", workforce: "contractor", workbookPhase: "Phase 3", pricePence: 10000, priceType: "fixed", priceNote: "60 minutes", summary: "A 60-minute deep-tissue massage by a qualified therapist, with health screening.", included: [], excluded: [], checks: "Qualification, contraindications, consent, insurance and complaints controls.", image: img("1600334089648-b0d9d3028eb2"), keywords: ["massage", "sports"] },
  // ---------------- Handyman ----------------
  {
    workbookRow: 23, slug: "furniture-assembly", category: "handyman", name: "Furniture assembly", availability: "available_now", workforce: "contractor", workbookPhase: "Phase 1 – marketplace", pricePence: 6500, priceType: "first_hour", priceNote: "first hour; extra time only with your approval", summary: "Assembly by a vetted independent professional. Choose standard furniture or boxed flat-pack when you book.",
    included: ["Assembly of the items you list", "Packaging gathered in one place", "Basic anti-tip brackets fitted where supplied"], excluded: ["Wall hanging beyond anti-tip brackets (book Picture / mirror / shelf hanging)", "Electrical or plumbing connections", "Taking packaging away"],
    checks: "Identity, references, tools, public liability insurance, scope and price approval.", image: img("1504148455328-c376907d081c"), keywords: ["flat-pack", "flatpack", "ikea", "wardrobe", "bed", "desk"],
    options: [
      { slug: "furniture", name: "Furniture assembly", description: "Furniture that is not supplied as a boxed flat-pack kit.", workbookRow: 23, pricePence: 6500, priceType: "first_hour", priceNote: "£65 for the first hour; any extra time needs your approval" },
      { slug: "flat-pack", name: "Flat-pack assembly", description: "Boxed, self-assembly furniture.", workbookRow: 26, pricePence: 6500, priceType: "hourly", priceNote: "£65 per hour, 1-hour minimum" },
    ],
  },
  { workbookRow: 26, slug: "flat-pack-furniture-assembly", category: "handyman", name: "Flat-pack furniture assembly", availability: "available_now", workforce: "contractor", workbookPhase: "Phase 1 – marketplace", pricePence: 6500, priceType: "hourly", priceNote: "per hour, 1-hour minimum", summary: "Boxed, self-assembly furniture. Booked as an option within Furniture assembly.", included: [], excluded: [], checks: "Provider tools, scope, minimum charge and damage process.", image: img("1504148455328-c376907d081c"), optionOf: "furniture-assembly" },
  { workbookRow: 24, slug: "picture-mirror-shelf-hanging", category: "handyman", name: "Picture / mirror / shelf hanging", availability: "available_now", workforce: "contractor", workbookPhase: "Phase 1 – marketplace", pricePence: 5500, priceType: "fixed", priceNote: "per job; wall and weight limits apply", summary: "Hanging pictures, mirrors and shelves, with wall-type and weight checks.", included: ["Hanging the items you list", "Wall-type check and suitable fixings", "Hidden pipe and cable check before drilling"], excluded: ["Very heavy items beyond safe weight limits", "Plastering or wall repairs"], checks: "Wall type, hidden-services checks, weight limits and exclusions.", image: img("1616046229478-9901c5536a45"), keywords: ["drill", "wall", "tv", "shelves"] },
  { workbookRow: 25, slug: "curtain-rail-blind-installation", category: "handyman", name: "Curtain rail / blind installation", availability: "available_now", workforce: "contractor", workbookPhase: "Phase 1 – marketplace", pricePence: 7500, priceType: "fixed", priceNote: "per job; survey if complex", summary: "Fitting curtain rails and blinds, with a survey for complex jobs.", included: ["Fitting the rails or blinds you supply", "Fixings suited to your wall", "Check that everything opens and closes smoothly"], excluded: ["Supplying rails, blinds or curtains", "Bay windows or motorised blinds without a survey"], checks: "Provider experience, access and wall checks.", image: img("1493809842364-78817add7ffb"), keywords: ["curtains", "blinds", "window"] },
  // ---------------- Plumbing ----------------
  { workbookRow: 27, slug: "tap-shower-fitting-replacement", category: "plumbing", name: "Tap / shower fitting replacement", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 11000, priceType: "from", priceNote: "parts extra", summary: "Replacing taps and shower fittings, with parts quoted separately. No gas work.", included: [], excluded: [], checks: "Verified competence, insurance, written quote; no gas work.", image: img("1585704032915-c3400ca199e7"), keywords: ["plumber", "tap", "shower"] },
  { workbookRow: 28, slug: "toilet-flush-leak-repair", category: "plumbing", name: "Toilet flush / leak repair", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 12500, priceType: "from", priceNote: "parts extra", summary: "Fixing flush problems and minor leaks, with a written quote before work.", included: [], excluded: [], checks: "Provider screening, quote approval, emergency limits.", image: img("1607472586893-edb57bdc0e39"), keywords: ["plumber", "leak", "toilet"] },
  { workbookRow: 29, slug: "drain-blockage-basic", category: "plumbing", name: "Drain blockage – basic", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 12000, priceType: "from", priceNote: "severity and access exclusions", summary: "Clearing basic blockages in sinks, showers and baths.", included: [], excluded: [], checks: "Scope boundaries, PPE, waste handling and insurance.", image: img("1556909212-d5b604d0c90d"), keywords: ["plumber", "drain", "blocked"] },
  // ---------------- Electrical (gated) ----------------
  { workbookRow: 30, slug: "light-fitting-socket-replacement", category: "electrical", name: "Light fitting / socket replacement", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Phase 3 – gated", pricePence: null, priceType: "not_priced", priceNote: "not yet offered", summary: "Replacing light fittings and sockets. Only by qualified electricians, once approvals are in place.", included: [], excluded: [], checks: "Qualifications and competence, building regulations and competent-person scheme requirements.", image: img("1621905251189-08b45d6a269e"), keywords: ["electrician", "socket", "light"] },
  { workbookRow: 31, slug: "electrical-fault-diagnosis", category: "electrical", name: "Electrical fault diagnosis", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Phase 3 – gated", pricePence: null, priceType: "not_priced", priceNote: "not yet offered", summary: "Finding the cause of electrical faults. Only by qualified electricians, once approvals are in place.", included: [], excluded: [], checks: "Competence, test equipment, certification and insurance verification.", image: img("1544724569-5f546fd6f2b5"), keywords: ["electrician", "fuse", "tripping"] },
  // ---------------- Gas (gated) ----------------
  { workbookRow: 32, slug: "boiler-gas-appliance-work", category: "gas-services", name: "Boiler / gas appliance work", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Deferred – gated", pricePence: null, priceType: "not_priced", priceNote: "not offered", summary: "Boiler and gas appliance work must be carried out by Gas Safe registered engineers. Everkind does not currently offer it.", included: [], excluded: [], checks: "Gas Safe registration (business and engineer), competence, insurance and compliance verification.", image: img("1621905252507-b35492cc74b4"), keywords: ["boiler", "gas", "heating", "cooker"] },
  // ---------------- Appliance repair ----------------
  { workbookRow: 33, slug: "washing-machine-dishwasher-diagnosis", category: "appliance-repair", name: "Washing machine / dishwasher diagnosis", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 8500, priceType: "callout", priceNote: "callout and diagnosis; parts extra", summary: "Diagnosis for washing machines and dishwashers, with repairs quoted before work.", included: [], excluded: [], checks: "Manufacturer competence where relevant, diagnostic fee and parts approval.", image: img("1626806787461-102c1bfaaea1"), keywords: ["washing machine", "dishwasher", "repair"] },
  { workbookRow: 34, slug: "fridge-freezer-diagnosis", category: "appliance-repair", name: "Fridge / freezer diagnosis", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 9500, priceType: "callout", priceNote: "callout and diagnosis; parts extra", summary: "Diagnosis for fridges and freezers, with repairs quoted before work.", included: [], excluded: [], checks: "Competence, refrigerant work restrictions, parts approval.", image: img("1571175443880-49e1d25b2bc5"), keywords: ["fridge", "freezer", "repair"] },
  // ---------------- Air conditioning (gated) ----------------
  { workbookRow: 35, slug: "domestic-ac-service", category: "air-conditioning", name: "Domestic AC service", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Phase 3 – gated", pricePence: null, priceType: "not_priced", priceNote: "not yet offered", summary: "Servicing domestic air-conditioning units. Requires F-Gas certified specialists.", included: [], excluded: [], checks: "F-Gas certification where applicable, insurance, safe handling.", image: img("1560185007-cde436f6a4d0"), keywords: ["air con", "aircon", "cooling"] },
  // ---------------- Pest control (gated) ----------------
  { workbookRow: 36, slug: "pest-inspection-treatment", category: "pest-control", name: "Pest inspection / treatment", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Phase 3 – gated", pricePence: null, priceType: "not_priced", priceNote: "not yet offered", summary: "Inspection and treatment plans by trained specialists, with full treatment records.", included: [], excluded: [], checks: "Training, product compliance, COSHH controls, insurance and treatment records.", image: img("1632935190508-bd46801c14af"), keywords: ["mice", "rats", "bed bugs", "pests"] },
  // ---------------- Painting ----------------
  { workbookRow: 37, slug: "room-painting", category: "painting-decorating", name: "Room painting", availability: "planned", workforce: "contractor", workbookPhase: "Phase 3", pricePence: 55000, priceType: "from", priceNote: "survey, prep and materials defined", summary: "Room painting with a survey, agreed materials and a written scope.", included: [], excluded: [], checks: "Written scope, materials approval, deposit and consumer rights, public liability.", image: img("1562259949-e8e7689d7828"), keywords: ["decorator", "paint", "walls"] },
  // ---------------- Pet care ----------------
  { workbookRow: 38, slug: "dog-walking-30-minutes", category: "pet-care", name: "Dog walking – 30 minutes", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 1700, priceType: "fixed", priceNote: "per walk", summary: "A 30-minute local walk by an insured pet-care provider.", included: [], excluded: [], checks: "Experience, insurance, dog-control policy, group-size limits, key handling.", image: img("1548199973-03cce0bbc87b"), keywords: ["dog", "walker"] },
  { workbookRow: 39, slug: "pet-home-visit-feeding", category: "pet-care", name: "Pet home visit / feeding – 30 minutes", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 1800, priceType: "fixed", priceNote: "per visit", summary: "A 30-minute home visit for feeding, fresh water and company.", included: [], excluded: [], checks: "References, emergency contact, care instructions, key and access controls.", image: img("1514888286974-6c03e2ca1dba"), keywords: ["cat", "feeding", "pet"] },
  { workbookRow: 40, slug: "pet-sitting-60-minutes", category: "pet-care", name: "Pet sitting – 60 minutes", availability: "coming_soon", workforce: "contractor", workbookPhase: "Phase 2", pricePence: 2800, priceType: "fixed", priceNote: "per visit", summary: "A 60-minute visit with play and care while you are out.", included: [], excluded: [], checks: "Experience, species limits, emergency vet consent and insurance.", image: img("1573865526739-10659fec78a5"), keywords: ["cat", "dog", "pet sitter"] },
  { workbookRow: 41, slug: "mobile-dog-grooming", category: "pet-care", name: "Mobile dog grooming", availability: "planned", workforce: "contractor", workbookPhase: "Deferred – asset-light listing only", pricePence: null, priceType: "not_priced", priceNote: "provider quote", summary: "Grooming at your door through established mobile groomers.", included: [], excluded: [], checks: "Care, custody and control cover, vehicle cover, animal welfare and handling checks.", image: img("1516734212186-a967f81ad0d7"), keywords: ["dog", "groomer"] },
  // ---------------- Childcare (gated) ----------------
  { workbookRow: 42, slug: "babysitting", category: "childcare", name: "Babysitting at child's home", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Deferred – compliance gate", pricePence: null, priceType: "not_priced", priceNote: "not offered", summary: "Childcare needs safeguarding checks and a registration review. Everkind does not currently offer it.", included: [], excluded: [], checks: "Legal review, registration or exemption, DBS eligibility, safeguarding, first aid, insurance and parental contracts.", image: img("1503454537195-1dcabb73ffb9"), keywords: ["babysitter", "children"] },
  { workbookRow: 43, slug: "nanny-daytime-childcare", category: "childcare", name: "Nanny / daytime childcare", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Deferred – compliance gate", pricePence: null, priceType: "not_priced", priceNote: "not offered", summary: "Nanny and daytime childcare need registration analysis and safeguarding. Everkind does not currently offer it.", included: [], excluded: [], checks: "DBS, references, safeguarding, paediatric first aid, registration analysis and insurance.", image: img("1587654780291-39c9404d746b"), keywords: ["nanny", "children"] },
  { workbookRow: 44, slug: "school-collection-after-school-care", category: "childcare", name: "School collection / after-school care", availability: "subject_to_approval", workforce: "regulated", workbookPhase: "Deferred – compliance gate", pricePence: null, priceType: "not_priced", priceNote: "not offered", summary: "School collection needs authorised-collection, safeguarding and consent processes. Everkind does not currently offer it.", included: [], excluded: [], checks: "Authorised collection, safeguarding, transport, parent consent and regulatory review.", image: img("1503676260728-1c00da094a0b"), keywords: ["school run", "children"] },
];

export const AVAILABILITY: Record<Availability, { label: string; meaning: string; action: string }> = {
  available_now: { label: "Available now", meaning: "Book in our service area.", action: "Book now" },
  coming_soon: { label: "Coming soon", meaning: "Planned for an upcoming launch phase.", action: "Notify me" },
  planned: { label: "Planned", meaning: "Part of Everkind's longer-term offering.", action: "Register interest" },
  subject_to_approval: { label: "Subject to approval", meaning: "Needs regulatory or compliance approval. Not currently provided.", action: "Register interest" },
};

/** Services shown as their own card (flat-pack appears inside Furniture assembly). */
export const LISTED_SERVICES = SERVICES.filter((s) => !s.optionOf);

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug && !s.optionOf);
export const servicesIn = (category: string) => LISTED_SERVICES.filter((s) => s.category === category);
export const serviceHref = (s: Pick<Service, "category" | "slug">) => `/services/${s.category}/${s.slug}`;

export function formatPence(p: number) {
  return p % 100 === 0 ? `£${p / 100}` : `£${(p / 100).toFixed(2)}`;
}

/** Customer-facing price text, following requirements §2.2 display rules. */
export function priceLabel(s: Service): string {
  if (s.availability === "available_now" && s.pricePence != null) {
    if (s.priceType === "hourly") return `${formatPence(s.pricePence)} per hour`;
    if (s.priceType === "first_hour" || s.priceType === "from") return `From ${formatPence(s.pricePence)}`;
    return formatPence(s.pricePence);
  }
  if (s.availability === "coming_soon" && s.pricePence != null) {
    return `Proposed from ${formatPence(s.pricePence)}${s.priceType === "hourly" ? "/hr" : ""}`;
  }
  return "Price not yet set";
}
