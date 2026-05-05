# sos-notify Edge Function

Sends an emergency email alert to the partner when an SOS event is triggered. Called directly from the frontend after inserting an SOS event row.

## How It Works

1. Frontend inserts an SOS event into the `sos_events` table.
2. Frontend calls this function with the `sosEventId`.
3. The function looks up the partner in the same couple, retrieves their email, and sends an alert via Resend.
4. Email sending uses exponential backoff retry (up to 3 attempts).

## Request Format

```json
POST /functions/v1/sos-notify

{
  "sosEventId": "uuid-of-the-sos-event"
}
```

## Response

- **200** — `{ "success": true }`
- **400** — `{ "error": "missing_sos_event_id" }`
- **404** — `{ "error": "sos_event_not_found" }`, `{ "error": "no_partner_found" }`, or `{ "error": "partner_email_not_found" }`
- **500** — `{ "success": false, "error": "email_failed" }` or `{ "error": "internal_error" }`

## Required Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (needed for admin auth lookup) |
| `RESEND_API_KEY` | API key for Resend email service |

## Deployment

```bash
supabase functions deploy sos-notify
```

### Setting the Resend API Key

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

## Testing Locally

```bash
supabase functions serve sos-notify

# Then in another terminal:
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/sos-notify' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"sosEventId":"your-sos-event-uuid"}'
```

## Email Provider

This function uses [Resend](https://resend.com/) for sending emails. You must:

1. Create a Resend account and obtain an API key.
2. Verify the sending domain (`duocheck.app`) in your Resend dashboard.
3. Set the `RESEND_API_KEY` secret in your Supabase project.
