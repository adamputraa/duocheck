# location-webhook Edge Function

Accepts location updates from iPhone Shortcuts (or any external client) via a token-based webhook.

## How It Works

1. A user generates a `shortcut_token` in their sharing settings.
2. The iPhone Shortcut (or any HTTP client) sends a POST request with the token and coordinates.
3. The function validates the token, checks sharing is enabled, and inserts a `location_update` row.

## Request Format

```json
POST /functions/v1/location-webhook

{
  "token": "your-shortcut-token",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10.5,
  "status": "Manual Check-In",
  "source": "ios_shortcut"
}
```

## Response

- **200** — `{ "success": true, "message": "Location updated" }`
- **400** — `{ "error": "missing_coordinates" }`
- **401** — `{ "error": "invalid_token" }`
- **403** — `{ "error": "sharing_disabled" }` or `{ "error": "not_in_couple" }`
- **500** — `{ "error": "insert_failed" }` or `{ "error": "internal_error" }`

## Required Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for token lookup) |

## Deployment

```bash
supabase functions deploy location-webhook
```

## Testing Locally

```bash
supabase functions serve location-webhook

# Then in another terminal:
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/location-webhook' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"token":"test-token","latitude":40.7128,"longitude":-74.0060}'
```
