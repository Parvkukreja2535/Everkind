-- Everkind 0002: customer accounts, professional applications and portal,
-- database-driven catalogue and pricing, admin roles, audit log, storage.
-- Run AFTER 0001_initial.sql. Safe to run more than once.
--
-- Security model:
--   * Every table has Row Level Security. Policies below are the only way in.
--   * Roles live in public.profiles.role. Nobody can change their own role or
--     account status: a trigger blocks it unless the caller is an admin (or the
--     server's service role). The FIRST admin is set by hand in the SQL editor
--     (see the README), never from the website.
--   * Privileged operations (accepting a job, changing booking status) go through
--     SECURITY DEFINER functions that check the caller themselves.

-- ---------------------------------------------------------------- types
do $$ begin create type user_role as enum ('customer', 'professional', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type account_status as enum ('active', 'suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type service_availability as enum ('available_now', 'coming_soon', 'planned', 'subject_to_approval'); exception when duplicate_object then null; end $$;
do $$ begin create type price_type as enum ('fixed', 'hourly', 'first_hour', 'from', 'callout', 'not_priced'); exception when duplicate_object then null; end $$;
do $$ begin create type application_status as enum ('submitted', 'under_review', 'info_required', 'approved', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type worker_type as enum ('employed', 'contractor'); exception when duplicate_object then null; end $$;
do $$ begin create type employment_preference as enum ('employed', 'self_employed', 'either', 'not_sure'); exception when duplicate_object then null; end $$;
do $$ begin create type assignment_action as enum ('offered', 'accepted', 'declined', 'assigned', 'unassigned'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  status account_status not null default 'active',
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  phone text not null default '' check (char_length(phone) <= 30),
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Home' check (char_length(label) <= 40),
  line1 text not null check (char_length(line1) between 3 and 200),
  line2 text check (char_length(line2) <= 200),
  city text not null default 'London' check (char_length(city) <= 80),
  postcode text not null check (char_length(postcode) between 5 and 10),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on customer_addresses (user_id);

-- ---------------------------------------------------------------- helper functions
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- True for the website's server (service role key) and for direct database sessions such as
-- the Supabase SQL editor. Requests from browsers always carry a role ('anon' or 'authenticated').
create or replace function is_service_role() returns boolean
language sql stable as $$ select coalesce(auth.role(), '') in ('service_role', '') $$;

-- New sign-up -> profile row. Any "role" in the sign-up metadata is ignored on purpose.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data->>'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data->>'last_name', ''), 80),
    left(coalesce(new.raw_user_meta_data->>'phone', ''), 30)
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Block self-promotion: role, status and email can only change via admin or the server.
create or replace function protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status or new.email is distinct from old.email or new.id is distinct from old.id)
     and not (is_admin() or is_service_role()) then
    raise exception 'Not allowed to change role, status or email' using errcode = '42501';
  end if;
  -- An admin cannot demote or suspend themselves by accident (keeps at least the acting admin).
  if old.id = auth.uid() and old.role = 'admin' and (new.role <> 'admin' or new.status <> 'active') and not is_service_role() then
    raise exception 'Admins cannot remove their own admin access' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists profiles_protect on profiles;
create trigger profiles_protect before update on profiles for each row execute function protect_profile();

-- ---------------------------------------------------------------- catalogue
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  workbook_name text,
  description text not null default '' check (char_length(description) <= 600),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  summary text not null default '' check (char_length(summary) <= 400),
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  checks text not null default '',
  image_url text not null default '',
  availability service_availability not null default 'coming_soon',
  workforce workforce not null,
  workbook_row int,
  workbook_phase text,
  everkind_addition boolean not null default false,
  keywords text[] not null default '{}',
  -- Pricing (all amounts are customer-facing pence)
  price_type price_type not null default 'fixed',
  price_pence int check (price_pence is null or price_pence between 0 and 1000000),
  price_note text not null default '',
  extra_hour_pence int check (extra_hour_pence is null or extra_hour_pence between 0 and 1000000),
  min_hours numeric(3,1) check (min_hours is null or min_hours between 0.5 and 12),
  hours_options numeric(3,1)[],
  duration_minutes int not null default 60 check (duration_minutes between 15 and 720),
  sort_order int not null default 0,
  is_active boolean not null default true,
  compliance_approved boolean not null default false,
  compliance_approved_by uuid references profiles(id),
  compliance_approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Regulated work can never be bookable without a recorded compliance approval.
  constraint regulated_needs_approval check (not (workforce = 'regulated' and availability = 'available_now' and not compliance_approved)),
  -- A bookable service must have a price (except "not priced" which can't be bookable).
  constraint bookable_needs_price check (availability <> 'available_now' or (price_type <> 'not_priced' and price_pence is not null)),
  -- Hourly services need a minimum duration.
  constraint hourly_needs_minimum check (price_type <> 'hourly' or min_hours is not null)
);
create index if not exists services_category_idx on services (category_id, sort_order);

create table if not exists service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '',
  workbook_row int,
  price_type price_type not null default 'fixed',
  price_pence int not null check (price_pence between 0 and 1000000),
  price_note text not null default '',
  min_hours numeric(3,1),
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (service_id, slug)
);

-- ---------------------------------------------------------------- professionals
create table if not exists professional_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null,
  phone text not null check (char_length(phone) between 7 and 30),
  home_postcode text not null check (char_length(home_postcode) between 5 and 10),
  services text[] not null check (cardinality(services) between 1 and 20),
  qualifications text not null default '' check (char_length(qualifications) <= 2000),
  experience text not null default '' check (char_length(experience) <= 2000),
  employment_preference employment_preference not null default 'not_sure',
  availability text not null default '' check (char_length(availability) <= 1000),
  introduction text not null default '' check (char_length(introduction) <= 1500),
  cv_path text,
  status application_status not null default 'submitted',
  info_request text,
  applicant_response text check (char_length(applicant_response) <= 2000),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references professional_applications(id) on delete cascade,
  status application_status not null,
  note text,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  application_id uuid references professional_applications(id) on delete set null,
  worker_type worker_type not null,
  status account_status not null default 'active',
  bio text not null default '' check (char_length(bio) <= 1500),
  home_postcode text not null default '',
  approved_by uuid references profiles(id),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists professional_services (
  professional_id uuid not null references professionals(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (professional_id, service_id)
);

create table if not exists professional_availability (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Monday
  start_time time not null check (start_time >= '08:00'),
  end_time time not null check (end_time <= '20:00'),
  check (start_time < end_time)
);

create table if not exists professional_time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  note text check (char_length(note) <= 200),
  check (starts_on <= ends_on)
);

create table if not exists professional_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('cv', 'qualification', 'insurance', 'id', 'right_to_work', 'dbs', 'other')),
  title text not null check (char_length(title) between 1 and 120),
  file_path text not null,
  expires_on date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function current_professional_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.id from professionals p join profiles pr on pr.id = p.user_id
  where p.user_id = auth.uid() and p.status = 'active' and pr.status = 'active';
$$;

-- Only admins (or the server) may change a professional's type or status.
create or replace function protect_professional() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.worker_type is distinct from old.worker_type or new.status is distinct from old.status
      or new.user_id is distinct from old.user_id or new.approved_by is distinct from old.approved_by)
     and not (is_admin() or is_service_role()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists professionals_protect on professionals;
create trigger professionals_protect before update on professionals for each row execute function protect_professional();

-- Applicants can only edit their response, and only while more information is requested.
create or replace function protect_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin() or is_service_role() then new.updated_at = now(); return new; end if;
  if old.status <> 'info_required' then raise exception 'Application is locked' using errcode = '42501'; end if;
  -- The only status change an applicant can make: answering an info request sends it back to review.
  if new.status is distinct from old.status
     and not (old.status = 'info_required' and new.status = 'under_review' and old.user_id = auth.uid()
              and new.applicant_response is distinct from old.applicant_response and new.applicant_response is not null) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if (new.user_id, new.info_request, new.services, new.email) is distinct from (old.user_id, old.info_request, old.services, old.email) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists applications_protect on professional_applications;
create trigger applications_protect before update on professional_applications for each row execute function protect_application();

-- ---------------------------------------------------------------- bookings (extend 0001)
alter table bookings add column if not exists customer_id uuid references profiles(id) on delete set null;
alter table bookings add column if not exists service_id uuid references services(id) on delete set null;
alter table bookings add column if not exists cancelled_at timestamptz;
alter table bookings add column if not exists cancellation_reason text;
alter table bookings add column if not exists confirmed_at timestamptz;
alter table bookings add column if not exists completed_at timestamptz;
do $$ begin
  alter table bookings add constraint bookings_assigned_fk foreign key (assigned_worker_id) references professionals(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists bookings_customer_idx on bookings (customer_id, requested_date);
create index if not exists bookings_worker_idx on bookings (assigned_worker_id, requested_date);

-- A contractor booking may only be "confirmed" (or later) once a professional is assigned.
do $$ begin
  alter table bookings add constraint confirmed_needs_professional check (
    status in ('requested', 'finding_professional', 'escalated', 'cancelled_by_customer', 'cancelled_by_everkind', 'not_fulfilled')
    or assigned_worker_id is not null);
exception when duplicate_object then null; end $$;

create table if not exists booking_assignments (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  action assignment_action not null,
  actor_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create unique index if not exists one_open_offer on booking_assignments (booking_id, professional_id) where action = 'offered';

alter table booking_events add column if not exists actor_id uuid references profiles(id);

-- One-click unsubscribe for "notify me" sign-ups (each sign-up gets a private token).
alter table service_interest add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists service_interest_token on service_interest (unsubscribe_token);

-- ---------------------------------------------------------------- audit log
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on audit_log (entity, entity_id, created_at desc);

create or replace function audit_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare changes jsonb := '{}'; k text; o jsonb; n jsonb;
begin
  if tg_op = 'INSERT' then
    insert into audit_log (actor_id, action, entity, entity_id, details) values (auth.uid(), 'created', tg_table_name, (to_jsonb(new)->>'id'), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_log (actor_id, action, entity, entity_id, details) values (auth.uid(), 'deleted', tg_table_name, (to_jsonb(old)->>'id'), to_jsonb(old));
    return old;
  end if;
  o := to_jsonb(old); n := to_jsonb(new);
  for k in select jsonb_object_keys(n) loop
    if k not in ('updated_at') and (o->k) is distinct from (n->k) then
      changes := changes || jsonb_build_object(k, jsonb_build_object('from', o->k, 'to', n->k));
    end if;
  end loop;
  if changes <> '{}' then
    insert into audit_log (actor_id, action, entity, entity_id, details) values (auth.uid(), 'updated', tg_table_name, (n->>'id'), changes);
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['categories', 'services', 'service_options', 'professionals', 'professional_applications', 'professional_services', 'settings'] loop
    execute format('drop trigger if exists %I_audit on %I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function audit_change()', t, t);
  end loop;
end $$;

-- Profiles: audit only role/status changes (not every name edit).
create or replace function audit_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    insert into audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'updated', 'profiles', new.id::text, jsonb_build_object('role', jsonb_build_object('from', old.role, 'to', new.role), 'status', jsonb_build_object('from', old.status, 'to', new.status)));
  end if;
  return new;
end $$;
drop trigger if exists profiles_audit on profiles;
create trigger profiles_audit after update on profiles for each row execute function audit_profile();

-- Bookings: every status or assignment change becomes a booking_event (customer-visible history).
create or replace function log_booking_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into booking_events (booking_id, status, note, actor_id) values (new.id, new.status, coalesce(new.cancellation_reason, null), auth.uid());
  end if;
  if new.assigned_worker_id is distinct from old.assigned_worker_id then
    insert into audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'reassigned', 'bookings', new.id::text, jsonb_build_object('from', old.assigned_worker_id, 'to', new.assigned_worker_id));
  end if;
  return new;
end $$;
drop trigger if exists bookings_log on bookings;
create trigger bookings_log after update on bookings for each row execute function log_booking_change();

-- ---------------------------------------------------------------- operational functions
-- Contractor accepts an open request. Atomic: only the first eligible contractor wins.
create or replace function accept_booking(p_booking uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare pro uuid := current_professional_id(); ok boolean;
begin
  if pro is null then raise exception 'Only approved professionals can accept jobs' using errcode = '42501'; end if;
  if not exists (select 1 from professionals where id = pro and worker_type = 'contractor') then
    raise exception 'Only independent contractors accept job requests' using errcode = '42501';
  end if;
  update bookings b set assigned_worker_id = pro, status = 'confirmed', confirmed_at = now()
  where b.id = p_booking and b.assigned_worker_id is null and b.status in ('finding_professional', 'escalated')
    and b.workforce = 'contractor'
    and exists (select 1 from professional_services ps join services s on s.id = ps.service_id
                where ps.professional_id = pro and s.slug = b.service_slug);
  get diagnostics ok = row_count;
  if ok then insert into booking_assignments (booking_id, professional_id, action, actor_id) values (p_booking, pro, 'accepted', auth.uid()); end if;
  return ok;
end $$;

-- Open contractor requests the caller is eligible for, WITHOUT the customer's name or full address.
create or replace function open_requests_for_me()
returns table (id uuid, reference text, service_slug text, option_slug text, requested_date date, requested_time time, duration_minutes int, postcode_district text, notes text, price_total_pence int, offered boolean)
language sql stable security definer set search_path = public as $$
  select b.id, b.reference, b.service_slug, b.option_slug, b.requested_date, b.requested_time, b.duration_minutes,
         split_part(b.postcode, ' ', 1), b.notes, b.price_total_pence,
         exists (select 1 from booking_assignments a where a.booking_id = b.id and a.professional_id = current_professional_id() and a.action = 'offered')
  from bookings b
  where current_professional_id() is not null
    and exists (select 1 from professionals p where p.id = current_professional_id() and p.worker_type = 'contractor')
    and b.workforce = 'contractor' and b.assigned_worker_id is null and b.status in ('finding_professional', 'escalated')
    and b.requested_date >= current_date
    and exists (select 1 from professional_services ps join services s on s.id = ps.service_id
                where ps.professional_id = current_professional_id() and s.slug = b.service_slug)
    and not exists (select 1 from booking_assignments a where a.booking_id = b.id and a.professional_id = current_professional_id() and a.action = 'declined')
  order by b.requested_date, b.requested_time;
$$;

create or replace function decline_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pro uuid := current_professional_id();
begin
  if pro is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  insert into booking_assignments (booking_id, professional_id, action, actor_id) values (p_booking, pro, 'declined', auth.uid());
end $$;

-- Assigned professional moves a job forward. Only forward steps are allowed.
create or replace function pro_update_booking_status(p_booking uuid, p_status booking_status) returns boolean
language plpgsql security definer set search_path = public as $$
declare pro uuid := current_professional_id(); cur booking_status; ok boolean;
begin
  if pro is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  select status into cur from bookings where id = p_booking and assigned_worker_id = pro for update;
  if cur is null then raise exception 'Not your booking' using errcode = '42501'; end if;
  if not ((cur = 'confirmed' and p_status = 'on_the_way') or (cur = 'on_the_way' and p_status = 'arrived')
       or (cur = 'arrived' and p_status = 'in_progress') or (cur = 'in_progress' and p_status = 'completed')) then
    raise exception 'That status change is not allowed' using errcode = '22023';
  end if;
  update bookings set status = p_status, completed_at = case when p_status = 'completed' then now() else completed_at end where id = p_booking;
  get diagnostics ok = row_count;
  return ok;
end $$;

-- Customer cancels their own booking (no fee is charged while payments are off).
create or replace function cancel_my_booking(p_booking uuid, p_reason text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update bookings set status = 'cancelled_by_customer', cancelled_at = now(), cancellation_reason = left(coalesce(p_reason, 'Cancelled by customer'), 300)
  where id = p_booking and customer_id = auth.uid()
    and status in ('requested', 'finding_professional', 'escalated', 'confirmed');
  get diagnostics ok = row_count;
  return ok;
end $$;

-- Applicant answers an "additional information required" request; goes back to review.
create or replace function respond_to_info_request(p_response text) returns boolean
language plpgsql security definer set search_path = public as $$
declare app uuid;
begin
  select id into app from professional_applications where user_id = auth.uid() and status = 'info_required';
  if app is null then return false; end if;
  update professional_applications set applicant_response = left(p_response, 2000), status = 'under_review', updated_at = now() where id = app;
  insert into application_events (application_id, status, note, actor_id) values (app, 'under_review', 'Applicant responded', auth.uid());
  return true;
end $$;

-- Functions are callable by signed-in users only.
revoke all on function accept_booking(uuid), decline_booking(uuid), pro_update_booking_status(uuid, booking_status), cancel_my_booking(uuid, text), respond_to_info_request(text), open_requests_for_me() from public, anon;
grant execute on function accept_booking(uuid), decline_booking(uuid), pro_update_booking_status(uuid, booking_status), cancel_my_booking(uuid, text), respond_to_info_request(text), open_requests_for_me() to authenticated;

-- ---------------------------------------------------------------- row level security
alter table profiles enable row level security;
alter table customer_addresses enable row level security;
alter table categories enable row level security;
alter table services enable row level security;
alter table service_options enable row level security;
alter table professional_applications enable row level security;
alter table application_events enable row level security;
alter table professionals enable row level security;
alter table professional_services enable row level security;
alter table professional_availability enable row level security;
alter table professional_time_off enable row level security;
alter table professional_documents enable row level security;
alter table booking_assignments enable row level security;
alter table audit_log enable row level security;

-- Drop-and-create keeps this script re-runnable.
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and policyname like 'ek_%' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles
create policy ek_profiles_select on profiles for select using (id = auth.uid() or is_admin());
create policy ek_profiles_update on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
-- addresses
create policy ek_addr_own on customer_addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ek_addr_admin on customer_addresses for select using (is_admin());
-- catalogue: public reads live items; admins manage everything
create policy ek_cat_public on categories for select using (is_active or is_admin());
create policy ek_cat_admin on categories for all using (is_admin()) with check (is_admin());
create policy ek_svc_public on services for select using ((archived_at is null and is_active and exists (select 1 from categories c where c.id = category_id and c.is_active)) or is_admin());
create policy ek_svc_admin on services for all using (is_admin()) with check (is_admin());
create policy ek_opt_public on service_options for select using (is_active or is_admin());
create policy ek_opt_admin on service_options for all using (is_admin()) with check (is_admin());
-- applications
create policy ek_app_own_select on professional_applications for select using (user_id = auth.uid() or is_admin());
create policy ek_app_own_update on professional_applications for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy ek_app_admin on professional_applications for all using (is_admin()) with check (is_admin());
create policy ek_appev_select on application_events for select using (is_admin() or exists (select 1 from professional_applications a where a.id = application_id and a.user_id = auth.uid()));
create policy ek_appev_admin on application_events for all using (is_admin()) with check (is_admin());
-- professionals
create policy ek_pro_select on professionals for select using (user_id = auth.uid() or is_admin());
create policy ek_pro_update_own on professionals for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy ek_pro_admin on professionals for all using (is_admin()) with check (is_admin());
create policy ek_prosvc_select on professional_services for select using (professional_id = current_professional_id() or is_admin());
create policy ek_prosvc_admin on professional_services for all using (is_admin()) with check (is_admin());
create policy ek_avail_own on professional_availability for all using (professional_id = current_professional_id() or is_admin()) with check (professional_id = current_professional_id() or is_admin());
create policy ek_off_own on professional_time_off for all using (professional_id = current_professional_id() or is_admin()) with check (professional_id = current_professional_id() or is_admin());
create policy ek_docs_own on professional_documents for select using (user_id = auth.uid() or is_admin());
create policy ek_docs_insert on professional_documents for insert with check (user_id = auth.uid() and verified = false);
create policy ek_docs_delete on professional_documents for delete using ((user_id = auth.uid() and verified = false) or is_admin());
create policy ek_docs_admin on professional_documents for update using (is_admin()) with check (is_admin());
-- bookings: customers see their own; professionals see jobs assigned to them; admins everything
drop policy if exists ek_book_select on bookings;
create policy ek_book_select on bookings for select using (customer_id = auth.uid() or assigned_worker_id = current_professional_id() or is_admin());
create policy ek_book_admin on bookings for update using (is_admin()) with check (is_admin());
create policy ek_bev_select on booking_events for select using (is_admin() or exists (select 1 from bookings b where b.id = booking_id and (b.customer_id = auth.uid() or b.assigned_worker_id = current_professional_id())));
create policy ek_bas_select on booking_assignments for select using (professional_id = current_professional_id() or is_admin());
create policy ek_bas_admin on booking_assignments for insert with check (is_admin());
-- admin-only data
create policy ek_email_admin on email_log for select using (is_admin());
create policy ek_interest_admin on service_interest for all using (is_admin()) with check (is_admin());
create policy ek_audit_admin on audit_log for select using (is_admin());
create policy ek_settings_public on settings for select using (true);
create policy ek_settings_admin on settings for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public) values ('professional-documents', 'professional-documents', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('catalogue-images', 'catalogue-images', true) on conflict (id) do nothing;

do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'ek_%' loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;
-- Private documents: each person can only touch files in a folder named after their own user id.
create policy ek_docs_read on storage.objects for select using (bucket_id = 'professional-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
create policy ek_docs_write on storage.objects for insert with check (bucket_id = 'professional-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy ek_docs_remove on storage.objects for delete using (bucket_id = 'professional-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
-- Catalogue images: anyone can view; only admins can upload or change.
create policy ek_img_read on storage.objects for select using (bucket_id = 'catalogue-images');
create policy ek_img_write on storage.objects for insert with check (bucket_id = 'catalogue-images' and is_admin());
create policy ek_img_update on storage.objects for update using (bucket_id = 'catalogue-images' and is_admin());
create policy ek_img_delete on storage.objects for delete using (bucket_id = 'catalogue-images' and is_admin());

-- Backfill profiles for anyone who signed up before this script ran.
insert into profiles (id, email) select id, coalesce(email, '') from auth.users on conflict (id) do nothing;
