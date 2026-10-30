# T7 Chat

[How It Worked](How%20It%20Worked.md)

Production-ready multi-provider AI chat with BYOK, Supabase authentication, encrypted account keys, streaming responses, inference telemetry, and Cloudflare deployment support.

## Requirements

- Node.js 20+
- pnpm
- Supabase project with Email/Password auth
- Cloudflare account for deployment

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000/chat`.

Set the Supabase URL, anon key, service-role key, and `AUTH_ENCRYPTION_KEY` in `.env.local`. Apply the SQL files in `supabase/migrations/` in filename order. Keep `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_ENCRYPTION_KEY`, `DATABASE_URL`, and provider keys out of source control; provider keys are entered in the app.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```

## Cloudflare deployment

```bash
npx wrangler login
pnpm cf:build
pnpm cf:deploy
```

Configure the public Supabase URL/key and app URL as Worker variables. Configure the service-role and encryption values as Worker secrets.

Supported providers include OpenAI, Anthropic, Google Gemini, Groq, Mistral, xAI, and OpenRouter. Models are loaded from provider APIs after a key is connected.

MIT License · Built by [Ankesh Singh](https://github.com/Ankesh-Singh)
