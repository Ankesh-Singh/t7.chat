# How It Worked

T7 Chat keeps the browser responsible for interaction and the server responsible for authenticated persistence, provider calls, and telemetry.

```mermaid
flowchart LR
  A[Supabase Auth] --> B[Browser JWT]
  B --> C[/api/chat]
  C --> D[Provider stream]
  C --> E[(sessions + messages)]
  D --> F[SDK telemetry]
  F --> G[/api/ingest]
  G --> H[(inference_logs)]
  B --> I[/api/metrics]
  I --> J[Dashboard table + charts]
  H -. realtime plus 10s refresh .-> J
```

- Every authenticated request forwards the current JWT. Server routes resolve the user before writing or reading account data.
- Sidebar refreshes are debounced and request-ordered, so token-by-token chat updates cannot overwrite newer session results.
- Sessions and metrics use `no-store`; the dashboard combines realtime inserts with a short reconciliation refresh.
- Telemetry stores model, latency, token estimates, status, and redacted previews. Provider secrets remain encrypted or browser-scoped.
