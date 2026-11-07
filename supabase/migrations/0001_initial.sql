-- Everkind initial schema (requirements v1.1 + v1.2 §17).
-- Phase 1: public bookings without payment, booking history, email log, service interest.
-- Price fields are kept so payments can be added later without redesign.
-- Row Level Security is ON for every table. With no policies, only the server
-- (service role key, used by the website's API routes) can read or write. Customer,
-- staff, contractor and admin policies are added with logins in the next phase.

-- Safe to run more than once: every statement checks whether its object already exists.

-- Admin-editable settings (operating hours, coverage, commission, VAT).
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('operating_hours', '{"opens": "08:00", "closes": "20:00"}'),
  ('coverage', '{"centre": {"lat": 51.5155, "lng": -0.0922, "name": "City of London"}, "radius_miles": 6}'),
  ('instant_clean', '{"hourly_rate_pence": 3500, "minimum_hours": 1}'),
  ('commission', '{"percent_of_ex_vat": 20}'),
  ('vat', '{"registered": false}'),
  ('payments', '{"enabled": false}')
on conflict (key) do nothing;

do $$ begin
  create type booking_status as enum (
    'requested', 'finding_professional', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed',
    'escalated', 'cancelled_by_customer', 'cancelled_by_everkind', 'not_fulfilled'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create type workforce as enum ('employed', 'contractor', 'regulated');
exception when duplicate_object then null; end $$;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  service_slug text not null,
  workbook_row int not null,
  option_slug text,
  workforce workforce not null,
  status booking_status not null,
  asap boolean not null default false,
  requested_date date not null,
  requested_time time,
  duration_minutes int not null check (duration_minutes > 0),
  hours numeric(3,1),
  tasks text[],
  price_total_pence int not null check (price_total_pence >= 0),
  price_description text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line text not null,
  postcode text not null,
  notes text,
  terms_accepted_at timestamptz not null,
  -- Filled in by later phases:
  customer_id uuid,
  organisation_id uuid,
  property_id uuid,
  assigned_worker_id uuid,
  arrival_window_start timestamptz,
  arrival_window_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_status_idx on bookings (status, requested_date);
create index if not exists bookings_email_idx on bookings (lower(customer_email));

create table if not exists booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  status booking_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- Every email the site generates, sent or not (admin "Sent emails" log).
create table if not exists email_log (
  id bigint generated always as identity primary key,
  booking_id uuid references bookings(id) on delete set null,
  to_address text not null,
  from_address text not null,
  subject text not null,
  body_text text not null,
  status text not null check (status in ('logged', 'sent', 'failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

-- "Notify me" / "Register interest" sign-ups, with consent record (kept 24 months).
create table if not exists service_interest (
  id bigint generated always as identity primary key,
  service_slug text not null,
  email text not null,
  postcode text,
  consent_text text not null,
  marketing_opt_in boolean not null default false,
  source text not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  delete_after timestamptz not null default (now() + interval '24 months')
);
create unique index if not exists service_interest_unique on service_interest (service_slug, lower(email)) where unsubscribed_at is null;

alter table settings enable row level security;
alter table bookings enable row level security;
alter table booking_events enable row level security;
alter table email_log enable row level security;
alter table service_interest enable row level security;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists bookings_touch on bookings;
create trigger bookings_touch before update on bookings for each row execute function touch_updated_at();
