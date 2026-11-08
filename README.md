# Everkind

Website for Everkind, a London home and personal services company.
Requirements: [`docs/BUSINESS_REQUIREMENTS.md`](docs/BUSINESS_REQUIREMENTS.md) (sections 16 and 17 are the latest decisions).

## What works now

- The public website: homepage, **Explore all services** (search and filters), 14 category pages and a
  page for every service (44 cards; flat-pack is an option inside Furniture assembly).
- A postcode check for the launch area (6 miles from the City of London).
- A booking form on every bookable service. Instant Clean is £35 per hour with a 1-hour minimum.
  The rules are enforced on the server too: 8am–8pm hours, minimum notice and the service area.
- "Notify me" / "Register interest" forms on services that aren't bookable yet, with a consent record.
- **No payments are taken.** Bookings are saved and a confirmation email is created for each one.
- Customer accounts, a professional application and portal, and an admin dashboard (see the setup steps below).

Bookings and interest sign-ups are saved only once Supabase is connected (below). Until then the
forms politely say online booking isn't switched on yet.

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

## Connect the database (Supabase)

1. Create a free project at https://supabase.com, choosing the London region.
2. In the project, open **SQL Editor**, paste the contents of `supabase/migrations/0001_initial.sql`, and run it.
3. In **Project Settings → API**, copy the Project URL, the `anon` key and the `service_role` key.
4. Add them as environment variables (see `.env.example`): in a local `.env.local` file, and in
   Vercel under **Project → Settings → Environment Variables**. Never commit or share the `service_role` key.

## Put it online (Vercel)

1. Sign in at https://vercel.com with GitHub and import the `everkind` repository.
2. Add the environment variables from step 4 above, then deploy. Each push to GitHub gets its own preview link.

## Emails

Every confirmation email is saved in the `email_log` table. Emails are actually delivered only when
`RESEND_API_KEY` is set and a real sending domain is verified in Resend. The contact address
`hello@everkind.example` is a placeholder on a reserved domain; replace it in `src/lib/site.ts`.

## Accounts, professional portal and admin dashboard: setup

Do these once, in order, in your Supabase project.

1. **Run the new database scripts.** In Supabase, open **SQL Editor → New query**. Paste the whole of
   `supabase/migrations/0002_accounts_admin.sql` and click **Run**, then do the same with
   `supabase/migrations/0003_seed_catalogue.sql`. Both are safe to run again.
2. **Set the website address for login emails.** In Supabase, open **Authentication → URL Configuration**:
   - Site URL: `https://everkind-uk.vercel.app`
   - Redirect URLs: add `https://everkind-uk.vercel.app/**`
3. **Create your own account** on the website (Log in → Create an account), and confirm it from the email.
4. **Make yourself the admin.** In the SQL Editor, run this with your email:

   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```

   Nobody can do this from the website. Admin access can only be granted here or by an existing admin.
5. Open `/admin` on the website.

**Login emails** (confirm account, reset password) are sent by Supabase's built-in email service, which
is limited to a few emails an hour and is meant for testing. For launch, add your own SMTP provider in
**Authentication → Emails → SMTP settings**.

### Database security tests

```bash
npm run test:db
```

This runs 66 checks on a temporary database. For example, a customer can't see another customer's
bookings, can't make themselves an admin and can't change prices, and only the first eligible
contractor can accept a job.

## Checks

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run build
```

## Photos

Service photos are from Unsplash (Unsplash License). The team T-shirt and van images in
`public/images/brand/` are illustrative mockups; see the credits file there. Replace them with real
Everkind photography before marketing.
