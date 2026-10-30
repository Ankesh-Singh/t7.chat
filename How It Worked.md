# How It Worked

The browser handles interaction. The server handles identity, persistence, provider calls, and telemetry.

```mermaid
flowchart TB
  A["User signs in"] --> B["Browser holds JWT"]
  B --> C["Chat request"]
  C --> D["Provider stream"]
  C --> E[("Sessions + messages")]
  D --> F["Telemetry"]
  F --> G[("Inference logs")]
  B --> H["Metrics request"]
  H --> G
  G --> I["Dashboard"]
  G -. "realtime + 10s refresh" .-> I
  C --> Q1["Why this split?"]
  Q1 --> A1["Fast UI; server-side control"]
  G --> Q2["How would I scale this?"]
  Q2 --> A2["Queue telemetry; paginate metrics"]
  I --> Q3["What could improve?"]
  Q3 --> A3["Retry telemetry; add end-to-end tests"]
```

## Thought process

- **Why this split?** Keep the UI responsive while the server controls user data and provider calls.
- **How would I scale this?** Queue telemetry, paginate metrics, and scope realtime updates by user.
- **What could improve?** Add durable telemetry retries and end-to-end tests against Supabase.
- **Why the refresh fallback?** Realtime is fast, but the short refresh catches missed events without serving stale data.
