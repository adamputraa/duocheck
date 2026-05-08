# DuoCare — Pregnancy Companion

DuoCare is a private pregnancy companion app for a husband and wife. It allows the couple to connect in a shared group and track the pregnancy journey together.

## Features

- **Private Couple Group**: Invite-code based pairing ensuring data is only shared between husband and wife.
- **Daily Check-Ins**: Wife can log feelings, symptoms, baby movement, and specific needs from the husband.
- **Realtime Dashboard**: Husband instantly sees his wife's updates.
- **Appointments**: Track doctor visits, scans, and blood tests.
- **Care Tasks**: Manage shared to-do lists for baby prep, home, and medicine.
- **Hospital Bag**: Shared checklist to prepare for delivery.
- **Emergency Help**: One-tap emergency alert that triggers an email and in-app notification to the partner with optional location tracking.

## Technology Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS, Realtime)
- **Email**: Resend API (via Supabase Edge Functions)
- **Deployment**: Cloudflare Pages
- **PWA**: Mobile-first design, installable as an app on iOS and Android.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Supabase Setup**:
   Apply migrations in order:
   - `001_initial_schema.sql` (legacy)
   - `002_rls_policies.sql` (legacy)
   - `003_fix_rls_recursion_and_bugs.sql` (legacy)
   - `004_fix_cascade_deletes.sql` (legacy)
   - `005_duocare_migration.sql` (converts to pregnancy app)
   - `006_duocare_rls.sql` (new RLS policies)

4. **Edge Functions**:
   Deploy the emergency notification function:
   ```bash
   supabase functions deploy emergency-notify
   supabase secrets set --env-file ./supabase/.env
   ```
   *(Ensure `RESEND_API_KEY` is set in Supabase Secrets).*

5. **Run Locally**:
   ```bash
   npm run dev
   ```

## Design Philosophy

The UI is optimized for mobile viewing, featuring a warm color palette (oranges and creams), large touch targets, and a card-based layout. The app operates in role-based contexts — the wife's view focuses on inputting data, while the husband's view focuses on monitoring and completing tasks.
