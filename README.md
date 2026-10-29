# T7 Chat

Production-ready, multi-provider AI chat with BYOK, email authentication, encrypted provider keys, responsive UI, and Cloudflare Workers deployment.

## Requirements

- Node.js 20+
- pnpm
- A Supabase project for accounts, encrypted key storage, and optional analytics
- Cloudflare account for deployment

## Environment

Copy the template:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Auth | Server-only database access |
| `AUTH_ENCRYPTION_KEY` | Auth | 32+ character secret for AES-GCM key encryption |
| `DATABASE_URL` | Migrations | Supabase Postgres connection string; never needed by the Worker runtime |
| `NEXT_PUBLIC_APP_URL` | Optional | Enables server-side inference log callbacks |

Provider API keys are entered in the app. Do not add provider keys to `.env.local`, Cloudflare, or source control.

## Supabase setup

1. Create a Supabase project and enable Email/Password under Authentication.
2. Apply [`supabase/migrations/001_auth_provider_keys.sql`](supabase/migrations/001_auth_provider_keys.sql) and [`supabase/migrations/002_application_schema.sql`](supabase/migrations/002_application_schema.sql) in order, using the Supabase SQL editor or `DATABASE_URL` from a trusted migration machine.
3. Add the four auth variables above to `.env.local`.
4. Add the same values to Cloudflare Worker secrets before deployment.

Provider keys are encrypted on the server before insertion into `provider_keys` and scoped to the authenticated user. Guest keys stay in the browser session.

The project uses Supabase Postgres and versioned SQL migrations directly. An additional ORM would add a Node-specific runtime dependency and reduce Cloudflare Worker compatibility, so no unused ORM layer is included.

To apply migrations with `psql`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/001_auth_provider_keys.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/002_application_schema.sql
```

In PowerShell, set `$env:DATABASE_URL` for the current session before running the same commands. Do not add `DATABASE_URL` to Cloudflare runtime variables unless a separate migration job needs it.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/chat`. Run checks with:

```bash
pnpm lint
pnpm test
pnpm build
```

## Cloudflare deployment

```bash
npx wrangler login
pnpm cf:build
pnpm cf:deploy
```

Configure production values as Worker secrets/variables:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put AUTH_ENCRYPTION_KEY
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` as non-secret Worker variables in the Cloudflare dashboard or `wrangler.jsonc`. Never commit secret values.

## Providers

OpenAI, Anthropic, Google Gemini, Groq, Mistral, xAI, and OpenRouter are supported. Models are loaded from each provider’s official API after the user connects a key.

---

MIT License · Built by [Ankesh Singh](https://github.com/Ankesh-Singh) · [Portfolio](https://aanks.xyz) · [LinkedIn](https://www.linkedin.com/in/ankeshsingh07/)
