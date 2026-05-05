# DuoCheck

A private, husband-wife check-in &amp; safety web app. Know your partner is safe — without being intrusive.

---

## 1. Project Overview

DuoCheck is a privacy-first location sharing and safety check-in app designed exclusively for couples. It provides real-time location visibility, manual and automated check-ins, SOS emergency alerts, and location history — all within a secure, invite-only environment where only two people share access.

**Key Features:**

- 🔐 Invite-only couple pairing (6-character code)
- 📍 Real-time &amp; manual location check-ins
- 🆘 SOS emergency alerts with partner email notification
- 📊 Location history with configurable retention
- 📱 PWA installable on iOS &amp; Android
- 🍎 iPhone Shortcut integration for automated check-ins
- 🔒 Row-Level Security (RLS) on every table
- ⏱️ Stale location detection (configurable threshold)

---

## 2. Philosophy

**Trust, not surveillance.** DuoCheck is built on the principle that location sharing between partners should be:

- **Consensual** — Both partners opt in; sharing can be paused at any time.
- **Transparent** — Every check-in is visible; there are no hidden trackers.
- **Minimal** — Data is retained only as long as needed (configurable, default 7 days).
- **Private** — No data is sold, shared, or used for advertising. Ever.
- **Equal** — Both partners have the same capabilities; neither has elevated access.

This is not a stalking tool. If trust is absent, no app can fix that.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS 3 |
| **Maps** | Leaflet + OpenStreetMap (no API key needed) |
| **Backend / Auth** | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| **Realtime** | Supabase Realtime (WebSocket subscriptions) |
| **Email Alerts** | Resend (via Supabase Edge Function) |
| **PWA** | Web App Manifest + Service Worker |
| **iPhone Automation** | iOS Shortcuts + Edge Function webhook |
| **Hosting** | Cloudflare Pages (or any static host) |

---

## 4. Local Setup

### Prerequisites

- Node.js 18+ and npm (or bun)
- A Supabase project (see Section 5)

### Steps

```bash
# Clone the repository
git clone https://github.com/your-org/duocheck.git
cd duocheck

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 5. Supabase Setup

### Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon/public key** from Settings → API.

### Enable Authentication

1. Go to Authentication → Providers.
2. Ensure **Email** is enabled.
3. (Optional) Enable **Magic Link** for passwordless login.
4. Configure email templates as needed.

### Configure Realtime

1. Go to Database → Replication.
2. Ensure Realtime is enabled for the `location_updates` and `sos_events` tables.
   (The migration script handles this automatically.)

---

## 6. Database Migrations

Run the migrations in order:

```bash
# Option 1: Using the Supabase CLI
supabase db push

# Option 2: Using the SQL Editor in the Supabase Dashboard
# Open SQL Editor and run each file in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
```

### Migration Files

| File | Description |
|---|---|
| `001_initial_schema.sql` | Creates all tables, indexes, triggers, and enables Realtime |
| `002_rls_policies.sql` | Enables Row-Level Security and creates all access policies |
| `seed.sql` | Empty seed file for development reference |

### Tables Created

- **profiles** — User profile information (name, avatar)
- **couples** — Couple groups with invite codes
- **couple_members** — Links users to couples (max 2 per couple)
- **location_updates** — Location check-in records
- **sharing_settings** — Per-user sharing preferences and shortcut tokens
- **sos_events** — Emergency alert events

---

## 7. RLS Security Notes

Row-Level Security is enabled on **every** table. Key principles:

- **Users can only access their own data** — Insert, update, and delete operations are restricted to the owning user via `auth.uid()` checks.
- **Partner access is relationship-based** — Partners can view each other's profiles, sharing settings, and location updates, but cannot modify them.
- **Couple membership is verified** — All cross-user access policies verify that both users belong to the same couple via the `couple_members` join table.
- **Couple size is enforced** — The insert policy on `couple_members` includes a `COUNT < 2` check to prevent more than 2 members.
- **SOS events are couple-scoped** — Both partners can view SOS events from their couple; only the creator can update (resolve) them.
- **Invite codes are public for lookup** — The `couples` table allows unauthenticated SELECT when `invite_code IS NOT NULL`, enabling the join flow.

> ⚠️ **Important:** Never disable RLS on any table. If you need to bypass RLS for administrative tasks, use the `service_role` key in Edge Functions only.

---

## 8. Couple Pairing Flow

### Creating a Couple

1. User A signs up and navigates to the Pairing screen.
2. User A clicks "Create Couple" — this generates a unique 6-character invite code.
3. A `couples` row is created, and User A is added to `couple_members`.

### Joining a Couple

1. User B signs up and navigates to the Pairing screen.
2. User B enters the invite code shared by User A.
3. The app looks up the couple by invite code (public SELECT policy).
4. User B is added to `couple_members` (RLS enforces max 2 members).
5. Both users can now see each other's location updates.

### Invite Code

- Generated as a random 6-character alphanumeric string.
- Can be regenerated by the couple creator.
- Unique across all couples (UNIQUE constraint).

---

## 9. SOS Flow

### Triggering an SOS

1. User presses the SOS button (long-press for safety, or dedicated button).
2. The app captures the user's current GPS coordinates.
3. A new row is inserted into `sos_events` with the user's location.
4. The app calls the `sos-notify` Edge Function with the `sosEventId`.
5. The Edge Function sends an email to the partner via Resend.

### Resolving an SOS

1. The partner views the active SOS event in the app.
2. The partner (or the sender) marks the event as resolved by setting `resolved_at`.
3. Only the SOS creator can update the event (RLS policy).

### Realtime Notification

- The `sos_events` table is subscribed to via Supabase Realtime.
- Partners see new SOS events instantly in the app without polling.
- An email is sent as a backup in case the partner doesn't have the app open.

---

## 10. Edge Functions Deployment

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked to your project.

### Deploy location-webhook

```bash
supabase functions deploy location-webhook
```

### Deploy sos-notify

```bash
supabase functions deploy sos-notify
```

### Set Secrets

```bash
# Required for sos-notify
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available
# in Edge Functions — no need to set them manually.
```

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test a function
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/location-webhook' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"token":"test","latitude":40.7128,"longitude":-74.0060}'
```

---

## 11. Cloudflare Pages Deployment

### Build Settings

| Setting | Value |
|---|---|
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node.js version** | 18 |

### Steps

1. Push your code to GitHub/GitLab.
2. In Cloudflare Pages, create a new project and connect your repository.
3. Set the build command and output directory as above.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

### Custom Domain (Optional)

1. In Cloudflare Pages settings, add your custom domain.
2. Update your Supabase project's allowed redirect URLs to include the new domain.

### Headers for PWA

Add a `_headers` file in the `public/` directory:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
/manifest.json
  Content-Type: application/manifest+json
/sw.js
  Content-Type: application/javascript
  Cache-Control: no-cache
```

---

## 12. iPhone Shortcut Setup

The iPhone Shortcut allows automated location check-ins from iOS without opening the app.

### Prerequisites

- A `shortcut_token` generated in the DuoCheck Settings page.
- The Shortcuts app on iOS.

### Creating the Shortcut

1. Open the **Shortcuts** app on your iPhone.
2. Create a new Shortcut.
3. Add the following actions:

   **Get Current Location:**
   - Action: "Get Current Location"
   - This provides latitude and longitude variables.

   **Get Contents of URL:**
   - URL: `https://your-project-ref.supabase.co/functions/v1/location-webhook`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "token": "your-shortcut-token",
       "latitude": "{{Current Location.latitude}}",
       "longitude": "{{Current Location.longitude}}",
       "accuracy": "{{Current Location.horizontalAccuracy}}",
       "status": "Auto Check-In",
       "source": "ios_shortcut"
     }
     ```

4. Name the shortcut (e.g., "DuoCheck Check-In").
5. (Optional) Add to Home Screen for quick access.

### Automation

You can also create a **Personal Automation** to trigger the shortcut:

- On a schedule (e.g., every hour during work hours)
- When arriving at or leaving a location
- At a specific time of day

### Security Note

The `shortcut_token` is a bearer credential. Treat it like a password:

- Do not share it with anyone other than your partner.
- Regenerate it if you suspect it has been compromised.
- It is stored in `sharing_settings.shortcut_token` and can be revoked from the Settings page.

---

## 13. PWA / Add to Home Screen

DuoCheck is a Progressive Web App and can be installed on both iOS and Android.

### iOS (Safari)

1. Open DuoCheck in Safari.
2. Tap the **Share** button (square with up arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Name the app and tap **Add**.

The app will appear on your home screen with the DuoCheck icon and open in standalone mode (no browser chrome).

### Android (Chrome)

1. Open DuoCheck in Chrome.
2. Chrome may show an "Install" banner automatically — tap it.
3. Or tap the **three-dot menu** → **"Install app"**.
4. Confirm the installation.

### Manifest

The PWA manifest is at `/manifest.json` and configures:

- App name and short name
- Theme color (#D97756 — warm orange)
- Background color (#FAF9F7 — warm white)
- Display mode: `standalone`
- App icons (192x192 and 512x512)

> **Note:** You need to provide the actual icon PNG files (`icon-192x192.png` and `icon-512x512.png`) in the `public/` directory. You can generate these from the included `favicon.svg`.

---

## 14. Environment Variables

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon/public key |

### Edge Functions (Supabase Secrets)

| Variable | Function | Required | Description |
|---|---|---|---|
| `SUPABASE_URL` | All | ✅ | Auto-set by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | All | ✅ | Auto-set by Supabase |
| `RESEND_API_KEY` | sos-notify | ✅ | Resend API key for sending emails |

### Setting Supabase Secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

> ⚠️ **Never commit `.env` files or API keys to version control.** The `.env` file is included in `.gitignore`.

---

## 15. Known Limitations

1. **Couple size is strictly 2** — The `couple_members` table enforces a maximum of 2 members per couple. This is by design and cannot be changed without modifying the RLS policies.

2. **No push notifications** — DuoCheck relies on Realtime subscriptions (WebSocket) for in-app notifications and email for SOS alerts. Native push notifications are not supported in the current version.

3. **Location history is finite** — By default, location data is retained for 7 days. Older entries should be cleaned up manually or via a scheduled Edge Function (not yet implemented).

4. **iPhone Shortcut requires manual setup** — Automated check-ins via iOS Shortcuts require the user to create the shortcut manually using the instructions in Section 12.

5. **No offline support** — The app requires an internet connection for all features. Offline caching of the last known location is not currently supported.

6. **Email deliverability** — SOS email notifications depend on Resend's deliverability. Ensure your sending domain is properly verified in Resend.

7. **Realtime connection limits** — Supabase Free tier has limits on concurrent Realtime connections. For a 2-person app, this is unlikely to be an issue.

8. **No native map tiles caching** — Map tiles are fetched from OpenStreetMap on every load. No tile caching is implemented.

---

## 16. Troubleshooting

### "Invalid token" when using iPhone Shortcut

- Verify the `shortcut_token` matches the one in your Sharing Settings.
- Ensure the token is sent in the JSON body (not as a URL parameter).
- Regenerate the token from Settings if needed.

### Realtime not working

- Check that Realtime is enabled for `location_updates` and `sos_events` in Supabase Dashboard → Database → Replication.
- Verify your anon key is correct.
- Check browser console for WebSocket connection errors.
- Ensure your Supabase plan supports Realtime connections.

### SOS email not sent

- Verify `RESEND_API_KEY` is set: `supabase secrets list`
- Check Edge Function logs: `supabase functions logs sos-notify`
- Verify the sending domain is configured in Resend.
- Ensure the partner has a valid email in `auth.users`.

### Location updates not appearing

- Check that both users are in the same couple (verify `couple_members` entries).
- Ensure `sharing_enabled` is `true` in `sharing_settings` for the sender.
- Check RLS policies — the receiving user must be a member of the same couple.
- Verify the `couple_id` is correctly set on the location update.

### PWA not installable

- Ensure `manifest.json` is accessible at `/manifest.json`.
- Verify the manifest has valid `icons` entries and the icon files exist.
- Check that the app is served over HTTPS (required for PWA).
- On iOS, PWA install is only available via Safari.

### "Not in couple" error from location-webhook

- The user must be a member of a couple before sending location updates.
- Complete the pairing flow first (create or join a couple).

---

## 17. Future Improvements

- **Push Notifications** — Integrate web push notifications for SOS alerts and stale location warnings, so partners are alerted even when the app is closed.
- **Automated History Cleanup** — Add a scheduled Edge Function (cron) to delete location updates older than the user's `history_retention_days` setting.
- **Geofencing** — Allow couples to define safe zones (e.g., home, work) and receive notifications when the partner arrives or leaves.
- **Battery Level Sharing** — Include device battery level in check-ins to give context (e.g., partner's phone may be dying).
- **In-App Chat** — Lightweight messaging between partners for quick coordination.
- **Location Share Pause** — A "pause sharing" mode that temporarily stops location updates without leaving the couple.
- **Apple Watch / Wear OS** — Native companion apps for quick SOS and check-ins from the wrist.
- **Multi-Language Support** — Internationalization (i18n) for non-English users.
- **Data Export** — Allow users to export their location history as GeoJSON or CSV.
- **Account Deletion** — Self-service account and data deletion flow in compliance with GDPR/CCPA.
- **End-to-End Encryption** — Encrypt location data client-side so even Supabase cannot read coordinates.
- **Biometric Lock** — Add Face ID / Touch ID / fingerprint lock when opening the app.

---

## License

Private — All rights reserved. This project is intended for personal use by the couple.
