# Everkind — Business Requirements Document
**Version 1.0 (Final, consolidated)** · Status: awaiting owner approval · No production code written

## Change history
| Version | Summary |
|---|---|
| 0.1 | Initial stack and architecture proposal (empty repository) |
| 0.2 | Rebuilt from the investor workbook and two research reports |
| 0.3 | Contractor request → accept flow; basic B2B accounts; flat-pack as an option; Instant Clean added |
| 0.4 | Brand identity, design system, layouts |
| 0.5 | One-stop platform: full catalogue visible, four availability labels, Explore All Services |
| **1.0** | **Final consolidation.** Instant Clean becomes hourly (1-hour minimum, rate set by admin). Arrival is shown as estimates only (no GPS). One set of operating hours, 8am–8pm, for every service. Simple Furniture vs Flat-pack wording. All outstanding minor decisions resolved (section 12). All contradictory older text removed. |

## How to read this document
- **Source of truth for services:** `Everkind_London_Investor_Business_Model_Final.xlsx`. It has 44 service rows; Instant Clean is the one Everkind addition.
- **The financial model** supplies business rules and assumptions only. It is **not** proof of demand or performance.
- **Placeholders:** where a value is a placeholder or an assumption, the document says so.

---

## 1. What Everkind is
Everkind is a London home and personal services company. Its long-term vision is to be **one place for virtually every home and personal service**. It launches in a small cluster of neighbouring postcodes and adds services only when demand, staffing, pricing and compliance are in place.

**Hybrid workforce**
| Model | Who | How bookings work | Revenue |
|---|---|---|---|
| **Employed** | Everkind cleaners, hairdressers, barbers, nail technicians | Instant confirmation against verified staff availability | All customer revenue is Everkind's |
| **Independent contractors** | Vetted self-employed professionals (handyman now; plumbing, appliance repair and others later) | Customer sends a request; the first eligible contractor to accept confirms it | Everkind commission: 20% of the ex-VAT value (the workbook's base case; can be changed in settings) |

**Customers**
- Individuals.
- **Business customers** (Airbnb hosts, property managers): basic B2B accounts at launch.

**Purpose of the first build**
- A working **demonstration** for the BN3358 pitch: Stripe **test mode**, with sample data clearly labelled as samples.
- The same code is later intended to launch as the real business.

### User roles
| Role | Capabilities |
|---|---|
| Individual customer | Register, book, manage bookings and addresses, approve extras, register interest |
| Business customer | Business account, business profile, multiple properties, book cleaning per property, bookings by property |
| Employed staff | Schedule, assigned jobs, Instant Clean duty, checklists, availability and time off, documents |
| Contractor | Job offers (accept/decline), assigned jobs, availability and service areas, documents, earnings ledger |
| Admin | Operations, allocation, people, catalogue and pricing, Instant Clean operations, accounts, payments and refunds, settings |

---

## 2. Service catalogue (45 records, 14 categories)

### 2.1 Availability labels
| Label | Meaning | Rows | Count | Bookable | Action |
|---|---|---|---|---|---|
| **Available now** | Bookable in supported postcodes | 13 workbook launch rows + Instant Clean | 14 | Yes, if conditions are met (2.4) | Book now |
| **Coming soon** | Planned for an upcoming launch phase | Phase 2 | 19 | No | Notify me |
| **Planned** | Part of the longer-term offering | Phase 3 (3) + mobile dog grooming | 4 | No | Register interest |
| **Subject to approval** | Needs regulatory, legal or compliance approval; **Everkind does not currently provide it** | Phase 3 gated (4) + gas + childcare (3) | 8 | No | Register interest |
| **Total** | | | **45** | | |

Every service is visible on the website. **No launch dates, reviews, bookings or availability are invented.**

### 2.2 Full catalogue
**Prices**
- Workbook prices are *proposed London test prices including VAT*, shown in pence-accurate form.
- "Website" shows the customer-facing label.
- `#` is the workbook row order. Instant Clean is #45.

**Price display on future services**
- "Coming soon" services show "Proposed from £X".
- "Planned" and "Subject to approval" services show no price.

| # | Category | Exact service name | Price | Pricing model | Workforce | Workbook phase | Website | Key compliance / controls |
|---|---|---|---|---|---|---|---|---|
| 1 | Cleaning | Short-let / Airbnb turnover clean – studio | £75 | Fixed per turnover | Employed | Launch | Available now | ID/right-to-work, references, training, key custody, checklist, photo QA, employers' + public liability |
| 2 | Cleaning | Short-let / Airbnb turnover clean – 1 bedroom | £95 | Fixed per turnover | Employed | Launch | Available now | As above; linen rules |
| 3 | Cleaning | Short-let / Airbnb turnover clean – 2 bedroom | £115 | Fixed per turnover | Employed | Launch | Available now | As above; extra bathroom / heavy-soil pricing |
| 4 | Cleaning | Short-let / Airbnb turnover clean – 3 bedroom | £145 | Fixed per turnover | Employed | Launch | Available now | As above |
| 45 | Cleaning | **Instant Clean** (Everkind addition) | **Hourly rate set by admin** (no figure assumed) | Hourly, 1-hour minimum, extra hours bookable | Employed (on duty) | Launch (not in workbook) | Available now | As employed cleaning; arrival is an estimate |
| 5 | Cleaning | Regular domestic cleaning | £28/hr | Hourly, 2-hour minimum | Employed | Phase 2 | Coming soon | Recurring schedules, paid travel |
| 6 | Cleaning | Deep cleaning | £180 | From (survey/scope) | Employed | Phase 2 | Coming soon | Checklist, exclusions, condition photos, quote approval |
| 7 | Cleaning | End-of-tenancy cleaning | £220 | From (size/inventory) | Employed | Phase 2 | Coming soon | Written scope, re-clean policy |
| 8 | Cleaning | Laundry / linen changeover | £25 | Fixed per property/load | Employed / laundry partner | Phase 2 | Coming soon | Chain of custody, loss/damage process |
| 9 | Beauty | Women's haircut / trim | £65 | Fixed | Employed | Launch – limited menu | Available now | Qualified stylist, hygiene, consultation, patch test |
| 10 | Beauty | Blow-dry / styling | £45 | Fixed | Employed | Launch – limited menu | Available now | Hair-length bands, portable kit safety |
| 11 | Beauty | Basic facial | £65 | Fixed | Employed | Phase 2 | Coming soon | Consent, contraindications, treatment liability |
| 12 | Beauty | Premium facial | £90 | Fixed | Employed | Phase 2 | Coming soon | Approved treatments only; no medical claims |
| 13 | Beauty | Waxing – arms / legs / underarms | £35 | From (area menu) | Employed | Phase 2 | Coming soon | Patch test, treatment insurance |
| 14 | Beauty | Manicure | £40 | Fixed | Employed | Launch – limited menu | Available now | Sanitation, allergy screening |
| 15 | Beauty | Gel manicure | £48 | Fixed | Employed | Phase 2 | Coming soon | Product handling, ventilation |
| 16 | Beauty | Pedicure | £48 | Fixed | Employed | Phase 2 | Coming soon | No medical foot care |
| 17 | Beauty | Party / occasion makeup | £95 | Fixed (travel/time bands) | Employed | Phase 2 | Coming soon | Portfolio, hygiene |
| 18 | Barbering | Men's haircut | £45 | Fixed | Employed | Launch – limited menu | Available now | Tool sterilisation, travel radius |
| 19 | Barbering | Haircut and beard trim | £58 | Fixed | Employed | Launch – limited menu | Available now | Defined duration, hygiene |
| 20 | Barbering | Beard trim / shaping | £28 | Fixed | Employed | Phase 2 | Coming soon | Tool hygiene, minimum booking |
| 21 | Wellness | Swedish / relaxation massage | £90 | Fixed, 60 min | Independent qualified professional | Phase 3 | Planned | Qualification, treatment insurance, consent, lone-worker safeguards |
| 22 | Wellness | Deep-tissue massage | £100 | Fixed, 60 min | Independent qualified professional | Phase 3 | Planned | Qualification, contraindications, insurance |
| 23 | Handyman | Furniture assembly | £65 | First hour; extra time approved by customer | Contractor | Phase 1 – marketplace | Available now (option: **Furniture assembly**) | ID, references, tools, public liability |
| 26 | Handyman | Flat-pack furniture assembly | £65/hr | Hourly, 1-hour minimum | Contractor | Phase 1 – marketplace | Available now (option: **Flat-pack assembly** inside the Furniture Assembly card) | Tools, scope, damage process |
| 24 | Handyman | Picture / mirror / shelf hanging | £55 | Fixed (wall/material limits) | Contractor | Phase 1 – marketplace | Available now | Wall type, hidden-services check, weight limits |
| 25 | Handyman | Curtain rail / blind installation | £75 | Fixed (survey if complex) | Contractor | Phase 1 – marketplace | Available now (confirmed) | Experience, wall checks |
| 27 | Plumbing | Tap / shower fitting replacement | £110 | From; parts extra | Contractor | Phase 2 | Coming soon | Competence, insurance; no gas work |
| 28 | Plumbing | Toilet flush / leak repair | £125 | From; parts extra | Contractor | Phase 2 | Coming soon | Quote approval, emergency limits |
| 29 | Plumbing | Drain blockage – basic | £120 | From | Contractor | Phase 2 | Coming soon | PPE, waste handling |
| 30 | Electrical | Light fitting / socket replacement | £110 | From | Qualified electrician | Phase 3 – gated | Subject to approval | Competent-person scheme, building regs |
| 31 | Electrical | Electrical fault diagnosis | £95 | Callout | Qualified electrician | Phase 3 – gated | Subject to approval | Certification, test equipment |
| 32 | Gas services | Boiler / gas appliance work | Not priced | Not offered | Gas Safe registered only | Deferred – gated | Subject to approval | Gas Safe registration (business + engineer) |
| 33 | Appliance repair | Washing machine / dishwasher diagnosis | £85 | Callout; parts extra | Contractor | Phase 2 | Coming soon | Diagnostic fee, parts approval |
| 34 | Appliance repair | Fridge / freezer diagnosis | £95 | Callout; parts extra | Contractor | Phase 2 | Coming soon | Refrigerant restrictions |
| 35 | Air conditioning | Domestic AC service | £130 | Per unit | Qualified specialist | Phase 3 – gated | Subject to approval | F-Gas certification |
| 36 | Pest control | Pest inspection / treatment | £145 | From | Qualified specialist | Phase 3 – gated | Subject to approval | COSHH, treatment records |
| 37 | Painting & decorating | Room painting | £550 | From; survey | Contractor | Phase 3 | Planned | Written scope, deposit, public liability |
| 38 | Pet care | Dog walking – 30 minutes | £17 | Fixed | Contractor | Phase 2 | Coming soon | Insurance, dog-control policy, keys |
| 39 | Pet care | Pet home visit / feeding – 30 minutes | £18 | Fixed | Contractor | Phase 2 | Coming soon | Emergency contact, keys |
| 40 | Pet care | Pet sitting – 60 minutes | £28 | Fixed | Contractor | Phase 2 | Coming soon | Emergency vet consent |
| 41 | Pet care | Mobile dog grooming | Not priced | Provider quote | Independent mobile groomer | Deferred – asset-light | Planned | Care/custody/control and vehicle cover |
| 42 | Childcare | Babysitting at child's home | Not priced | Not offered | Specialist / gated | Deferred – compliance gate | Subject to approval | Legal review, Ofsted, DBS, safeguarding |
| 43 | Childcare | Nanny / daytime childcare | Not priced | Not offered | Specialist / gated | Deferred – compliance gate | Subject to approval | DBS, paediatric first aid, registration |
| 44 | Childcare | School collection / after-school care | Not priced | Not offered | Specialist / gated | Deferred – compliance gate | Subject to approval | Authorised collection, safeguarding |

**Category display names**
- "Painting" is shown as **Painting & decorating** and "Gas" as **Gas services**. The workbook values are kept internally.
- Category order: Cleaning, Beauty, Barbering, Wellness, Handyman, Plumbing, Electrical, Gas services, Appliance repair, Air conditioning, Pest control, Painting & decorating, Pet care, Childcare.

### 2.3 Launch Plan discrepancies (documented, not changed)
The workbook's Launch Plan pilot row names fewer services than the catalogue marks as launch:
- Studio turnover clean (Launch Plan says "1–3 bedroom")
- Haircut and beard trim
- Curtain rail/blind installation
- Flat-pack assembly

Decision: **the catalogue classification prevails.** All are launch services; curtain rail/blind was explicitly confirmed by the owner.

### 2.4 When a service is bookable
A service shows a Book button **only if all** of these are true:
1. It is labelled Available now.
2. Admin has activated it.
3. It has a price or hourly rate.
4. For gated categories, compliance approval has been recorded.
5. At least one qualified worker with valid documents exists.
6. The customer's postcode is in a service area.

This is enforced on the server too, so typing a booking web address directly does nothing.

**Regulated services** (gas, electrical, AC, pest control, childcare) explain who may lawfully do the work and state that Everkind does not currently offer it.

### 2.5 Furniture Assembly
- **One card and one page.** At booking the customer picks:
  - **Furniture assembly**: assembling furniture that is *not* supplied as a boxed flat-pack kit. £65 for the first hour; extra time is proposed by the professional and approved by the customer.
  - **Flat-pack assembly**: assembling boxed, self-assembly furniture. £65 per hour, 1-hour minimum.
- Both options keep their own workbook row, price and rules.

### 2.6 Instant Clean (final)
- **What it is:** on-demand household cleaning by an equipped, employed Everkind cleaner. It is promoted prominently on the homepage.
- **Tasks** (customer selects any number):
  1. General tidying
  2. Washing dishes, including loading and unloading the dishwasher
  3. Kitchen cleaning (accessible surfaces, worktops, hob, sink)
  4. Bathroom cleaning (toilets, sinks, taps, mirrors, showers, baths)
  5. Vacuuming and mopping
  6. Dusting accessible furniture and household surfaces
  7. Making beds
  8. Emptying household bins
- **Not included:** ovens, inside fridges or cupboards, windows, carpet/upholstery cleaning, laundry, heavy soiling or mould, biohazards, work at height.
- **Pricing:**
  - Billed **by the hour**, with a **1-hour minimum**; the customer can choose 1, 1.5, 2, 3 or 4 hours.
  - The **hourly rate is set by an admin.** No rate is assumed in this document; the demo shows a placeholder labelled "Sample rate".
  - The **total price is shown before confirming.**
  - Extra time on the day needs customer approval in the app.
- **What happens within the time booked:** the cleaner prioritises the selected tasks. The customer may drag tasks into priority order. The page states: *"Your cleaner will work through your selected tasks in priority order within the time booked. We can't guarantee every task will be completed in the time chosen."*
- **When:**
  - *As soon as possible*: shows an estimated arrival time.
  - *Later today*: the customer picks a time.
  - In both cases the job must finish by 8pm (section 4).
- **Old Instant Clean rules removed:** the previous "£35 starting price", fixed price per job, "about 30 minutes guaranteed" wording and separate 9am–9pm hours have all been removed.

---

## 3. Booking logic

### 3.1 Employed services: instant confirmation
This covers short-let turnover cleaning, salon and barber services.
1. Postcode check, then service and options, then address or saved property, then service questions.
2. The system shows **genuinely available slots**: qualified staff with valid documents, within their working hours, minus time off, existing bookings and travel buffers, and only inside 8am–8pm.
3. Card is held, then the slot is reserved for one staff member **atomically**: the database rejects overlapping bookings for the same person.
4. **Confirmed instantly.** The customer sees a 1-hour **arrival window**.

### 3.2 Instant Clean: on-demand dispatch (employed)
1. Address, tasks and priority order, then hours, then ASAP or later today.
2. **For ASAP**, the system finds a cleaner who is on duty, free now, and has an estimated travel time within the admin-set target. It shows *"Cleaner arriving in approximately 35 minutes"*.
3. Card hold, then the cleaner is reserved atomically, then **confirmed**. The cleaner taps **On my way / Arrived / Completed**.
4. **No cleaner available:** the customer is told honestly and offered the earliest later slot today or tomorrow. Nothing is charged.
5. **Cleaner doesn't acknowledge within 5 minutes:** the job is reassigned to the next free cleaner, admin is alerted and the customer is informed. If no one can attend, the booking is cancelled, the hold released and the customer notified.

### 3.3 Contractor services: request → accept → confirm
1. **Requested.** The card is held and the customer sees *"Request received — we're finding a professional."*
2. **Finding professional.** Eligible contractors (right service, covering the postcode, documents valid, free at that time) are notified.
3. **Confirmed.** The first to accept wins. This is a single atomic database action, so two contractors can never both win. Other offers close and the customer gets the professional's name and an arrival window.
4. **Escalated.** If nobody accepts within **30 minutes**, the request goes to the admin *Needs attention* queue and the customer is updated.
5. **Not fulfilled.** If the request is still unassigned **12 hours before** the requested time (or within 2 hours for same-day requests), it is cancelled, the hold released and the customer notified with alternative times.

Every request therefore ends as **Confirmed** or **Cancelled with the customer informed.** A scheduled check runs every 5 minutes to enforce this.

### 3.4 Statuses
`requested → finding_professional → confirmed → on_the_way → arrived → in_progress → completed`
- Other outcomes: `escalated`, `cancelled_by_customer`, `cancelled_by_everkind`, `not_fulfilled`, `refunded`.
- Employed bookings start at `confirmed`.

### 3.5 Extras
- The worker proposes the extra time or charge.
- The customer approves or declines in their account.
- Only approved amounts are captured.

---

## 4. Operating hours (all services)
- **8:00am–8:00pm, every day, for every category, including Instant Clean.**
  - The booking system never offers slots outside these hours.
  - A booking (including the hours chosen) must **finish by 8:00pm**.
  - ASAP Instant Clean is only offered while an estimated arrival plus the booked hours fits before 8pm.
- Hours are stored as an admin setting so they can be changed later without code changes.
- **Assumptions:**
  - Bookings need a minimum notice of **2 hours** for scheduled employed services and **24 hours** for contractor services; Instant Clean ASAP is exempt.
  - Slots are 30 minutes long.

## 5. Arrival estimates (no location tracking)
- **Customers see only an estimated arrival time or window**, for example:
  - "Professional arriving in approximately 25 minutes"
  - "Arriving in approximately 1 hour"
  - "Expected between 2:00pm and 3:00pm"
- **How it's calculated:**
  - the booking time;
  - the worker's previous job and its status (e.g. "completed" or "in progress");
  - the worker tapping "On my way";
  - a **travel-time estimate between postcode districts**, held in an admin-editable table (default **30 minutes** within the launch cluster, matching the workbook's 0.5-hour cleaner travel allowance).
- **When the estimate updates:** when the worker taps *On my way*, finishes the previous job, or marks *Running late*.
- **What is never built:** no GPS, no live map, no moving location, and the feature is never called "tracking".
- **Wording shown on the page:** *"Arrival times are estimates and may change. We'll update you if anything changes."*

---

## 6. Basic B2B business accounts (launch)
- **At launch, a business can:**
  - Register as a business (business name, contact, phone, billing address; optional company number and VAT number).
  - Edit its business profile.
  - Save **multiple properties**. Each holds: nickname, address, type, bedrooms, bathrooms, access instructions, key-safe or access code (encrypted), linen and parking notes.
  - Book **cleaning** for a property: short-let turnovers and Instant Clean.
  - View upcoming and past bookings **by property**, with status and completion photos.
- **Payment:** by card, the same hold-then-charge flow as individuals.
- **Later phase:** recurring bookings, negotiated contract pricing, monthly invoicing, team members, and non-cleaning services for businesses.
- **Prepared now:** the database already has organisation and member tables, and bookings are linked to the organisation and property. One central pricing function means contract prices can be added later without restructuring.
- **Marketing:** the *For Hosts & Property Managers* page includes "Create business account" and an enquiry form for larger portfolios.

## 7. Payments (Stripe test mode only)
- **Supported actions:** card hold at booking or request; capture after completion; release the hold if cancelled or not fulfilled; full or partial refunds by admin; extras captured only after customer approval.
- **Bookings more than ~6 days ahead:** the card is saved now and held closer to the date.
- **Live payments and real contractor payouts stay switched off** until the workflow is tested and legal and accounting arrangements are confirmed.
- **Contractor share:** recorded in a **payout ledger**. Stripe Connect can be added later without redesign.
- **Commission rate:** a setting, default 20%.

## 8. VAT (configurable)
- A `tax_rates` table with effective dates; a VAT treatment per service; and a global "VAT-registered" setting.
- **No hardcoded 20%.**
- Each booking stores frozen net, VAT, gross, rate and treatment, all in pence.
- Customers always see one clear total.
- Labels follow the settings ("incl. VAT" / "VAT not applicable").
- **Assumption:** workbook prices are entered as customer-facing gross prices.

## 9. Compliance, privacy and honesty
- **Worker documents:** right-to-work, ID, insurance and qualifications, each with an expiry date. Expired documents automatically block allocation, and admin is alerted 30 days before expiry.
- **Gated services** cannot be activated without a recorded compliance approval (who and when). This is enforced in the database.
- **Access codes** are encrypted, revealed only to the assigned worker from 2 hours before the job, and every view is logged.
- **Service pages** show scope, exclusions, price model, cancellation policy and who does the work.
- **Honest content:** no invented customer counts, ratings, reviews or launch dates. The reviews section stays hidden until real reviews exist. Demo data is labelled "Sample".
- **Interest registration:**
  - The consent box is not pre-ticked and its purpose is specific.
  - Marketing consent is a separate, optional box.
  - Consent text and time are recorded; every email has one-click unsubscribe.
  - Records are kept for 24 months, then deleted.
- **UK GDPR:** privacy notice, cookie consent, minimal data collection.
- **Cancellation policy** (placeholder for legal review):
  - Free cancellation up to 24 hours before.
  - Inside 24 hours, a fee may apply as shown at booking.
  - Re-clean requests within 24 hours, with photos.

---

## 10. Website and application pages

### Public website (hospitality style)
- **Home:**
  - Hero: "Everything your home needs. One place." with the sub-line "From everyday cleaning to home maintenance, beauty and beyond — discover services designed around your life."
  - Prominent **Instant Clean** band.
  - Available now services.
  - **Explore All Services** category tiles.
  - How it works.
  - Why Everkind (factual claims only).
  - For Hosts.
  - Areas.
  - FAQ.
- **Explore All Services** (`/services`):
  - Search across names, descriptions and keywords.
  - Availability filter chips.
  - Category navigation.
  - Photo cards with label, description and price display.
- **Category pages** and **service detail pages for all 45 services**: description, included/excluded, price and model, who does the work, compliance info, FAQ, and the action button for its label.
- **Instant Clean page:** task list, hourly pricing explanation, arrival-estimate explanation, 8am–8pm hours.
- **Other pages:** For Hosts & Property Managers, How it works, Trust & safety, Areas, Become a professional / Careers, About, Contact, Help, Terms, Privacy, Cookies, Cancellation policy.

### Booking flow
- **Steps:** postcode → service/option → address or property → questions or tasks → time → sign in or register → card hold → result.
- **Result shown:**
  - Employed services: *Confirmed + arrival window*.
  - Contractor services: *Request received*.
  - Instant Clean: *Confirmed + estimated arrival*.

### Logged-in applications (Evernote-inspired usability, Everkind styling)
All apps share one shell: a persistent forest-green sidebar, a top bar with search, notifications and the account menu, list → detail panels, and status chips.

| Application | Sections |
|---|---|
| **Customer** | Overview, Bookings (upcoming/past, status timeline, arrival estimate, approve extras, cancel), Addresses, Payment methods, Notifications & interests, Settings |
| **Business** | Overview, Properties, Bookings by property, Business profile, Settings |
| **Staff** | Today, Schedule, Instant Clean duty, Job detail (checklist, photos, extras, status buttons), Availability & time off, Documents |
| **Contractor** | Job offers (accept/decline), My jobs, Availability & areas, Earnings ledger, Documents |
| **Admin** | Overview & KPIs, Needs attention, Bookings & allocation, Instant Clean operations, Schedule, Staff & contractors, Customers & businesses, Catalogue manager, Interest & enquiries, Payments & refunds, Settings (hours, travel times, commission, VAT, time limits) |

**Admin KPIs** (from the workbook's proof points): repeat-booking rate, staff utilisation, contractor fill rate and time-to-accept, contribution per booking, complaint/rework rate, Instant Clean estimated-vs-actual arrival, and turned-away requests.

**Catalogue manager:**
- Add or edit categories and services; edit descriptions, images and keywords.
- Set prices, pricing models and hourly rates; change labels; activate or deactivate services.
- Set required worker documents; record compliance approval.
- Manage interest lists.
- All changes are audited, and the website updates automatically.

---

## 11. Brand and design system
- **Two modes:**
  - The *public website* feels like a premium hospitality and lifestyle brand.
  - The *logged-in apps* feel like calm, organised software, inspired by Evernote's usability principles. Evernote's branding, icons, layouts and visual design are **not** used.
- **Palette:**
  | Token | Hex | Use |
  |---|---|---|
  | Forest | #183D35 | Logo, navigation, primary buttons, key elements |
  | Ivory | #F5F2EA | Backgrounds |
  | Sage | #A8B9A5 | Secondary panels, chips, accents |
  | Champagne | #C5A46D | Small premium details |
  | Charcoal | #292D2B | Text |
- **Accessibility shades.** Champagne (2.1:1) and sage (1.9:1) are too faint for text on ivory, so supporting shades are used for text:
  - deep champagne ≈ #82632E
  - deep sage #5E7461
  - muted charcoal #5C625F
  - light sage tint #E4EAE1 and border #D9E0D5
  - muted status colours: success #2F6B4F, warning #8A5A12, error #A23B2C, info #2E5A73
- **Typography:**
  - **Playfair Display** for public headlines and editorial headings only.
  - **DM Sans** for navigation, body text, buttons, forms, prices and all dashboards.
- **Components:**
  - 4px spacing scale; 12px card radius; 10px button and input radius.
  - Buttons: primary (forest), secondary (outline), tertiary (link), destructive.
  - Cards: service, info, status, KPI tile.
  - Labelled forms with step progress.
  - Status and availability chips, always with text.
  - Lucide line icons.
  - Gentle 150–250ms motion that respects "reduce motion".
- **Responsive:**
  | Screen | Behaviour |
  |---|---|
  | Mobile (<640px) | Single column; public full-screen menu + sticky Book button; app bottom tab bar |
  | Tablet | Collapsible icon sidebar |
  | Desktop | Full layouts |
- **Imagery:** warm, natural, licensed stock for the demo; no AI-generated people. Services without a photo get a branded fallback tile.
- **Logo:** temporary Playfair "Everkind" wordmark in forest green with a small champagne detail, until a final logo exists.
- **Other choices:** no dark mode at launch; the public nav turns forest green on scroll.

---

## 12. Decisions and assumptions (final)
| Area | Decision / assumption |
|---|---|
| Catalogue | 45 records (44 workbook + Instant Clean), 14 categories; workbook classification prevails over the Launch Plan pilot list |
| Labels | 14 Available now, 19 Coming soon, 4 Planned (incl. mobile grooming), 8 Subject to approval |
| Future prices | Coming soon shows "Proposed from £X"; Planned and Subject to approval show no price |
| Interest | Allowed on all non-bookable services, with careful wording; kept 24 months |
| Instant Clean | Hourly, 1-hour minimum, admin-set rate (placeholder in demo), 8 tasks, priority order, no completion guarantee, ASAP or later today |
| Arrival | Estimates and windows only, from schedule + status + postcode travel table; no GPS or maps |
| Hours | 8am–8pm for all services; must finish by 8pm; 30-minute slots |
| Notice | 2 hours (employed scheduled), 24 hours (contractor), ASAP for Instant Clean |
| Contractor timing | Escalate after 30 minutes; auto-cancel 12 hours before (2 hours for same-day) |
| Instant Clean dispatch | Reassign if unacknowledged after 5 minutes |
| Accounts | Account required to book (needed for approvals, status and arrival updates) |
| B2B | Basic business accounts at launch: cleaning only, card payment |
| Payments | Stripe test mode; payout ledger; no live money until legal/accounting sign-off |
| VAT | Configurable; prices stored as customer gross; frozen per booking |
| Service area | Placeholder postcode districts in the demo; editable by admin |
| Content | I draft all service descriptions from the workbook scope; owner reviews before launch |
| Design | Supporting accessible shades approved by default; temporary wordmark; Lucide icons; licensed stock photos |

## 13. Risks to address before real-world launch
1. **Worker status:** contractors must genuinely be self-employed in practice (control, substitution, pricing, right to decline). Legal review of contractor terms is needed.
2. **VAT and principal-vs-agent treatment** of marketplace bookings, and whether Everkind is VAT-registered. This affects prices, invoices and the commission calculation. Accountant advice needed.
3. **Instant Clean economics:** the workbook explicitly excluded an "emergency 30-minute response". On-duty cleaners are paid while waiting, which lowers the 68% utilisation assumption. The hourly rate, on-call staffing and arrival performance must be tested in the pilot.
4. **Insurance:** employers' liability (compulsory), public liability, treatment liability, care/custody/control for pets, and cover for keys and access codes. Broker quotes needed.
5. **Regulated services** (gas, electrical, AC/F-Gas, pest control, childcare/Ofsted/DBS): must stay non-bookable until registrations and approvals are verified.
6. **Data protection:** ICO registration fee; a DPIA (formal privacy risk assessment) for storing access codes and home data; privacy notice; retention policy; processor agreements (Supabase, Stripe, Resend).
7. **Consumer law:** clear terms, total price, cancellation and refund rights, and approval of extras. Legal review of terms, the cancellation policy and Instant Clean's "no completion guarantee" wording.
8. **Payments:** Stripe live activation (business verification), handling of disputes and chargebacks, and the ~7-day limit on card holds.
9. **Employment:** right-to-work checks, contracts, payroll, pension auto-enrolment, holiday and sickness pay for employed staff.
10. **Technical:** reliable notifications (email first; SMS later), uptime monitoring, backups, security review of access-code handling, and load testing of dispatch before marketing.

## 14. Development plan (after approval)
**Stack:** Next.js + TypeScript + Tailwind CSS (Everkind design tokens) on Vercel; Supabase (Postgres, Auth, Storage, Row Level Security); Stripe test mode; Resend email.

**Order of work**
1. Premium public website
2. Full 45-record catalogue (database-driven)
3. Explore All Services, category and service pages, interest forms
4. Individual and business registration and login
5. Booking flows (employed instant, Instant Clean, contractor request → accept)
6. Allocation and dispatch with time limits, plus arrival estimates
7. Customer and basic business accounts
8. Staff and contractor portals
9. Admin dashboard and catalogue manager
10. Payments in Stripe test mode
11. *(Later)* Advanced B2B, Stripe Connect, live payments

**Accounts needed** (free to start): Vercel, Supabase, Stripe (test mode), Resend; a domain name later. Secrets are never put in chat or code.

**How we'll verify:**
- Each step published to a Vercel preview link.
- Access rules tested per role.
- Race tests: contractor accept, staff double-booking, Instant Clean dispatch.
- Time-limit tests: escalation, cancellation, hold release.
- Stripe test-card flows.
- Hours enforcement (no slots outside 8am–8pm).
- An end-to-end browser test of every journey before the demo.

## 15. Visual preview
**What it is:** a single clickable HTML prototype, published as a private Artifact page (https://claude.ai/artifact/M2TKXgcNTpzcZsavUNYeRz). Source: `docs/preview/everkind-preview.html`. It uses the Everkind palette, Playfair Display and DM Sans, and works on desktop and mobile.

**Screens:**
1. Public homepage
2. Explore All Services: all 45 services, working search and category/availability filters
3. Service detail pages: Instant Clean, Furniture Assembly (with the flat-pack option), a Coming soon example, a Subject to approval example
4. Customer dashboard
5. Admin dashboard

**What it doesn't do:**
- It carries a persistent **"Design preview: no real bookings, payments, availability or arrival estimates"** banner.
- All figures are labelled "Sample".
- Buttons that would perform actions show a "Preview only" notice.
