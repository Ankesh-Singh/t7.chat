# How It Worked

T7 Chat keeps the browser fast and puts identity, persistence, provider calls, and telemetry behind server routes.

## Architecture

```mermaid
flowchart LR
  A["User signs in"] --> B["Browser JWT"]
  B --> C["Chat API"]
  C --> D["Provider stream"]
  C --> E[("Sessions + messages")]
  D --> F["Telemetry"]
  F --> G[("Inference logs")]
  B --> H["Metrics API"]
  H --> G
  G --> I["Dashboard"]
  G -. "realtime + refresh" .-> I
```

## Request flow

1. Supabase Auth signs the user in. The browser keeps the JWT and sends it with authenticated requests.
2. `POST /api/chat` validates the model, provider, key, and session ID.
3. The server saves the user message, calls the provider, and streams the response over SSE.
4. The completed assistant message is saved to the same session.
5. The SDK sends latency, token estimates, status, and redacted previews to `POST /api/ingest`.
6. The dashboard reads the user’s records through `GET /api/metrics`.

## Data and security

- Sessions, messages, and logs belong to a `user_id`.
- Server routes resolve the user from the JWT before reading or writing data.
- Database policies protect direct reads and writes for the authenticated user.
- The service-role key stays on the server. It is never exposed to the browser.
- Authenticated provider keys are encrypted and account-scoped. Guest keys stay in the browser session.

## Sidebar behavior

The sidebar keeps a local copy so a new conversation appears immediately. Authenticated sessions are then refreshed from the server.

Refreshes are debounced and ordered. This matters during streaming because every token can trigger a local update; an older request must not overwrite a newer session list.

If the server has not persisted a new session yet, the local copy remains visible instead of being replaced by an empty response.

## Metrics behavior

Inference logs contain only operational data: provider, model, latency, token estimates, status, and short redacted previews.

The metrics and session APIs use `no-store`, so the dashboard does not reuse stale responses. Realtime inserts make new data appear quickly, while a short refresh repairs the view if a realtime event is missed.

Failed ingestion writes are recorded in `failed_logs` for investigation.

## Design questions

### Why keep the server as the trust boundary?

The browser should feel immediate, but it should not decide which account owns a session or a metric. The server applies the same ownership rule to chat, sessions, keys, and analytics.

### How would I scale this?

Move telemetry to a queue, paginate or time-limit dashboard queries, keep realtime subscriptions user-scoped, and archive older logs.

### What could improve?

Use provider-reported token usage instead of estimates, add durable telemetry retries with idempotency, and run authenticated end-to-end tests against a disposable Supabase project.

### Why use both realtime and refresh?

Realtime is responsive but not a delivery guarantee. A short no-store refresh is a simple fallback that keeps the dashboard correct.

## Production checklist

- Apply the SQL migrations in filename order.
- Use a real Supabase `service_role` key on the server; never use the anon key in that variable.
- Keep encryption and database secrets out of source control.
- Enable Supabase realtime for `inference_logs` if live dashboard inserts are needed.
- Monitor `failed_logs` and provider error rates before scaling traffic.
