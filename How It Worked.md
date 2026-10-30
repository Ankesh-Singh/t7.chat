## Architecture

![Architecture diagram](image.png)

## Request flow

1. Supabase Auth signs the user in. The browser keeps the JWT and sends it with authenticated requests.
2. `POST /api/chat` validates the model, provider, key, and session ID.
3. The server saves the user message, calls the provider, and streams the response over SSE.
4. The completed assistant message is saved to the same session.
5. The SDK sends latency, token estimates, status, and redacted previews to `POST /api/ingest`.
6. The dashboard reads the user’s records through `GET /api/metrics`.

### How would I scale this?

Move telemetry to a queue, paginate or time-limit dashboard queries, keep realtime subscriptions user-scoped, and archive older logs.

### What could improve?

Use provider-reported token usage instead of estimates, add durable telemetry retries with idempotency, and run authenticated end-to-end tests against a disposable Supabase project.

### Why use both realtime and refresh?

Realtime is responsive but not a delivery guarantee. A short no-store refresh is a simple fallback that keeps the dashboard correct.
