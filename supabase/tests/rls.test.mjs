import { PGlite } from "@electric-sql/pglite";
process.on("unhandledRejection", (e) => { console.log("CRASH:", e.message, e.query ?? ""); process.exit(1); });
import { readFileSync } from "node:fs";
const M = new URL("../migrations/", import.meta.url).pathname;
const db = new PGlite();
// --- minimal stand-ins for Supabase's auth + storage schemas and API roles ---
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(nullif(current_setting('request.jwt.claims', true), '')::json->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claims', true), '')::json->>'role' $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
grant usage on schema auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
`);
for (const pass of [1, 2]) for (const f of ["0001_initial.sql", "0002_accounts_admin.sql", "0003_seed_catalogue.sql"]) {
  try { await db.exec(readFileSync(M + f, "utf8")); } catch (e) { console.log(`FAIL running ${f} (pass ${pass}):`, e.message); process.exit(1); }
}
console.log("migrations ran twice: OK");
await db.exec(`grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;`);

const as = async (who, sql, params = []) => {
  const claims = who === "anon" ? { role: "anon" } : who === "service" ? { role: "service_role" } : { sub: who, role: "authenticated" };
  const role = who === "anon" ? "anon" : who === "service" ? "service_role" : "authenticated";
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}; select set_config('request.jwt.claims', '${JSON.stringify(claims)}', true);`);
    return tx.query(sql, params);
  });
};
let pass = 0, fail = 0;
const expect = async (name, fn, want) => {
  let got; try { got = await fn(); got = want === "error" ? "no error" : got; } catch (e) { got = want === "error" ? "error" : "ERR " + e.message; }
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)})`}`);
};
const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222", ADM = "33333333-3333-3333-3333-333333333333";
const PE = "44444444-4444-4444-4444-444444444444", PC = "55555555-5555-5555-5555-555555555555", PC2 = "66666666-6666-6666-6666-666666666666";
for (const [id, meta] of [[A, { first_name: "Ann", role: "admin" }], [B, {}], [ADM, {}], [PE, {}], [PC, {}], [PC2, {}]])
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, id.slice(0, 4) + "@example.com", JSON.stringify(meta)]);
await db.query("update profiles set role = 'admin' where id = $1", [ADM]); // first admin is set by hand in the SQL editor

const counts = async () => (await db.query("select (select count(*) from categories)::int c, (select count(*) from services)::int s, (select count(*) from service_options)::int o")).rows[0];
await expect("seed: 14 categories, 44 services, 2 options", counts, { c: 14, s: 44, o: 2 });
await expect("sign-up metadata cannot grant admin", async () => (await db.query("select role from profiles where id=$1", [A])).rows[0].role, "customer");

// Profiles
await expect("customer cannot make themselves admin", () => as(A, "update profiles set role='admin' where id=$1", [A]), "error");
await expect("customer cannot un-suspend themselves", () => as(A, "update profiles set status='suspended' where id=$1", [A]), "error");
await expect("customer can edit own name", async () => (await as(A, "update profiles set first_name='Annie' where id=$1 returning first_name", [A])).rows[0].first_name, "Annie");
await expect("customer cannot see another customer's profile", async () => (await as(A, "select * from profiles where id=$1", [B])).rows.length, 0);
await expect("customer cannot edit another customer's profile", async () => (await as(A, "update profiles set first_name='x' where id=$1 returning id", [B])).rows.length, 0);
await expect("anon sees no profiles", async () => (await as("anon", "select * from profiles")).rows.length, 0);
await expect("admin can see all profiles", async () => (await as(ADM, "select count(*)::int n from profiles")).rows[0].n, 6);
await expect("admin can promote a user", async () => (await as(ADM, "update profiles set role='professional' where id=$1 returning role", [PE])).rows[0].role, "professional");
await expect("admin cannot remove own admin access", () => as(ADM, "update profiles set role='customer' where id=$1", [ADM]), "error");

// Catalogue
await expect("anon can read live services", async () => (await as("anon", "select count(*)::int n from services")).rows[0].n, 44);
await as(ADM, "update services set is_active=false where slug='manicure'");
await expect("disabled service hidden from public", async () => (await as("anon", "select count(*)::int n from services where slug='manicure'")).rows[0].n, 0);
await expect("disabled service still visible to admin", async () => (await as(ADM, "select count(*)::int n from services where slug='manicure'")).rows[0].n, 1);
await as(ADM, "update categories set is_active=false where slug='barbering'");
await expect("inactive category hides its services", async () => (await as("anon", "select count(*)::int n from services s join categories c on c.id=s.category_id where c.slug='barbering'")).rows[0].n, 0);
await as(ADM, "update categories set is_active=true where slug='barbering'"); await as(ADM, "update services set is_active=true where slug='manicure'");
await expect("customer cannot change a price", async () => (await as(A, "update services set price_pence=1 where slug='instant-clean' returning id")).rows.length, 0);
await expect("anon cannot change a price", async () => (await as("anon", "update services set price_pence=1 where slug='instant-clean' returning id")).rows.length, 0);
await expect("customer cannot add a service", () => as(A, "insert into services (slug, category_id, name, workforce) select 'x', id, 'Hack', 'employed' from categories limit 1"), "error");
await expect("admin can change Instant Clean hourly rate", async () => (await as(ADM, "update services set price_pence=4000 where slug='instant-clean' returning price_pence")).rows[0].price_pence, 4000);
await expect("price change is in the audit log with the admin as actor", async () => {
  const r = (await db.query("select actor_id, details->'price_pence' p from audit_log where entity='services' and action='updated' order by id desc limit 1")).rows[0];
  return [r.actor_id, r.p.from, r.p.to]; }, [ADM, 3500, 4000]);
await expect("regulated service cannot go live without compliance approval", () => as(ADM, "update services set availability='available_now', price_pence=1000, price_type='fixed' where slug='boiler-gas-appliance-work'"), "error");
await expect("hourly service needs a minimum duration", () => as(ADM, "update services set min_hours=null where slug='instant-clean'"), "error");
await expect("customer cannot read audit log", async () => (await as(A, "select * from audit_log")).rows.length, 0);

// Bookings
const mk = async (ref, svc, wf, status, cust) => (await db.query(`insert into bookings (reference, service_slug, workbook_row, workforce, status, requested_date, duration_minutes, price_total_pence, price_description, customer_name, customer_email, customer_phone, address_line, postcode, terms_accepted_at, customer_id)
  values ($1,$2,1,$3,$4,current_date+3,60,6500,'x','N','e@x','0700','1 Secret St','EC2V 7HH',now(),$5) returning id`, [ref, svc, wf, status, cust])).rows[0].id;
const bA = await mk("EK-A", "mens-haircut", "employed", "requested", A);
const bB = await mk("EK-B", "furniture-assembly", "contractor", "finding_professional", B);
await expect("customer sees own booking", async () => (await as(A, "select reference from bookings")).rows.map((r) => r.reference), ["EK-A"]);
await expect("customer cannot see other bookings", async () => (await as(A, "select * from bookings where id=$1", [bB])).rows.length, 0);
await expect("customer cannot edit booking directly", async () => (await as(A, "update bookings set price_total_pence=0 where id=$1 returning id", [bA])).rows.length, 0);
await expect("contractor booking cannot be confirmed with nobody assigned", () => db.query("update bookings set status='confirmed' where id=$1", [bB]), "error");
await expect("customer can cancel own booking", async () => (await as(A, "select cancel_my_booking($1) ok", [bA])).rows[0].ok, true);
await expect("customer cannot cancel someone else's booking", async () => (await as(A, "select cancel_my_booking($1) ok", [bB])).rows[0].ok, false);
await expect("cancellation recorded in booking history", async () => (await as(A, "select status from booking_events where booking_id=$1", [bA])).rows.map((r) => r.status), ["cancelled_by_customer"]);

// Professionals
const pro = async (uid, type) => (await db.query("insert into professionals (user_id, worker_type, approved_by) values ($1,$2,$3) returning id", [uid, type, ADM])).rows[0].id;
const pE = await pro(PE, "employed"), pC = await pro(PC, "contractor"), pC2 = await pro(PC2, "contractor");
await db.query("insert into professional_services select $1, id from services where slug='furniture-assembly'", [pC]);
await db.query("insert into professional_services select $1, id from services where slug='furniture-assembly'", [pE]);
await expect("contractor cannot change own worker type", () => as(PC, "update professionals set worker_type='employed' where user_id=$1", [PC]), "error");
await expect("contractor sees open request without name/address", async () => {
  const r = (await as(PC, "select * from open_requests_for_me()")).rows; return [r.length, Object.keys(r[0]).includes("address_line"), r[0].postcode_district]; }, [1, false, "EC2V"]);
await expect("contractor without that service sees nothing", async () => (await as(PC2, "select * from open_requests_for_me()")).rows.length, 0);
await expect("employed professional cannot accept contractor jobs", () => as(PE, "select accept_booking($1)", [bB]), "error");
await expect("customer cannot accept jobs", () => as(A, "select accept_booking($1)", [bB]), "error");
await expect("unqualified contractor cannot accept", async () => (await as(PC2, "select accept_booking($1) ok", [bB])).rows[0].ok, false);
await expect("eligible contractor accepts", async () => (await as(PC, "select accept_booking($1) ok", [bB])).rows[0].ok, true);
await expect("second accept fails (first wins)", async () => (await as(PC, "select accept_booking($1) ok", [bB])).rows[0].ok, false);
await expect("booking now confirmed and assigned", async () => Object.values((await db.query("select status, assigned_worker_id from bookings where id=$1", [bB])).rows[0]), ["confirmed", pC]);
await expect("assigned pro now sees full booking", async () => (await as(PC, "select address_line from bookings where id=$1", [bB])).rows[0].address_line, "1 Secret St");
await expect("other pro cannot see it", async () => (await as(PC2, "select * from bookings where id=$1", [bB])).rows.length, 0);
await expect("pro cannot skip status steps", () => as(PC, "select pro_update_booking_status($1,'completed')", [bB]), "error");
await expect("pro moves job forward", async () => (await as(PC, "select pro_update_booking_status($1,'on_the_way') ok", [bB])).rows[0].ok, true);
await expect("other pro cannot update it", () => as(PC2, "select pro_update_booking_status($1,'arrived')", [bB]), "error");
await expect("customer sees status history of own booking", async () => (await as(B, "select status from booking_events where booking_id=$1 order by id", [bB])).rows.map((r) => r.status), ["confirmed", "on_the_way"]);
await expect("pro manages own availability", async () => (await as(PC, "insert into professional_availability (professional_id, weekday, start_time, end_time) values ($1,0,'09:00','17:00') returning id", [pC])).rows.length, 1);
await expect("availability outside 8am–8pm rejected", () => as(PC, "insert into professional_availability (professional_id, weekday, start_time, end_time) values ($1,0,'07:00','21:00')", [pC]), "error");
await expect("pro cannot set another pro's availability", () => as(PC, "insert into professional_availability (professional_id, weekday, start_time, end_time) values ($1,0,'09:00','10:00')", [pC2]), "error");
await db.query("update professionals set status='suspended' where id=$1", [pC2]);
await expect("suspended pro has no professional access", async () => (await as(PC2, "select current_professional_id() id")).rows[0].id, null);

// Applications
const app = (await db.query("insert into professional_applications (user_id, first_name, last_name, email, phone, home_postcode, services, consent_at) values ($1,'B','B','b@x','07000000','EC1A 1BB',array['manicure'],now()) returning id", [B])).rows[0].id;
await expect("applicant sees own application", async () => (await as(B, "select status from professional_applications")).rows[0].status, "submitted");
await expect("applicant cannot approve themselves", () => as(B, "update professional_applications set status='approved'"), "error");
await expect("other users cannot see the application", async () => (await as(A, "select * from professional_applications")).rows.length, 0);
await as(ADM, "update professional_applications set status='info_required', info_request='Please upload your certificate' where id=$1", [app]);
await expect("applicant cannot move status without responding", () => as(B, "update professional_applications set status='under_review'"), "error");
await expect("applicant cannot approve while info required", () => as(B, "update professional_applications set status='approved', applicant_response='x'"), "error");
await expect("applicant responds to info request", async () => (await as(B, "select respond_to_info_request('Uploaded') ok")).rows[0].ok, true);
await expect("application locked again after responding", () => as(B, "update professional_applications set introduction='changed'"), "error");
await expect("application back under review", async () => (await db.query("select status from professional_applications where id=$1", [app])).rows[0].status, "under_review");

// Storage
await expect("user uploads into own folder", async () => (await as(B, "insert into storage.objects (bucket_id, name) values ('professional-documents', $1) returning id", [`${B}/cv.pdf`])).rows.length, 1);
await expect("user cannot upload into someone else's folder", () => as(B, "insert into storage.objects (bucket_id, name) values ('professional-documents', $1)", [`${A}/cv.pdf`]), "error");
await expect("other users cannot read the CV", async () => (await as(A, "select * from storage.objects where bucket_id='professional-documents'")).rows.length, 0);
await expect("admin can read the CV", async () => (await as(ADM, "select * from storage.objects where bucket_id='professional-documents'")).rows.length, 1);
await expect("customer cannot upload catalogue images", () => as(A, "insert into storage.objects (bucket_id, name) values ('catalogue-images', 'x.jpg')"), "error");
await expect("admin can upload catalogue images", async () => (await as(ADM, "insert into storage.objects (bucket_id, name) values ('catalogue-images', 'x.jpg') returning id")).rows.length, 1);

// Interest + email log are admin-only
await db.query("insert into service_interest (service_slug, email, consent_text, source) values ('deep-cleaning','z@x','c','test')");
await expect("customer cannot read interest list", async () => (await as(A, "select * from service_interest")).rows.length, 0);
await expect("admin reads interest list", async () => (await as(ADM, "select count(*)::int n from service_interest")).rows[0].n, 1);
await expect("customer cannot read email log", async () => (await as(A, "select * from email_log")).rows.length, 0);
console.log(`\n${pass} passed, ${fail} failed`);
