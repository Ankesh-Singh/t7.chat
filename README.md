# T7 Chat

A fast, production-oriented, multi-provider chat workspace with a Notion-style interface.

## What changed

- BYOK architecture: users add their own provider key in the app.
- Keys live in browser `sessionStorage`; they are sent only with the active request and never stored in server environment variables.
- The model picker uses the reference interaction: provider rail, searchable live catalog, connected-key indicators, and model metadata.
- Each provider catalog is fetched from that provider's official `/models` endpoint.
- Streaming chat supports stop, retry, Markdown, tables, links, and copyable code blocks.
- Local conversation history includes search, rename, and delete.
- Notion-style dark mode is the default; light mode is available from the compact top bar toggle and persists per browser.
- Session search supports title and message-content matches, `Ctrl/Cmd + K` focus, and a second confirmation before deletion.
- The supplied `/public/applogo.png` asset is used for the favicon, dashboard, sidebar, and empty-state branding.
- Optional Supabase sync and inference analytics.
- Cloudflare Workers deployment through OpenNext.

## Providers

| Provider | Official API | Key page |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | https://platform.openai.com/api-keys |
| Anthropic | `https://api.anthropic.com/v1` | https://console.anthropic.com/settings/keys |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | https://aistudio.google.com/apikey |
| Groq | `https://api.groq.com/openai/v1` | https://console.groq.com/keys |
| Mistral | `https://api.mistral.ai/v1` | https://console.mistral.ai/api-keys |
| xAI | `https://api.x.ai/v1` | https://console.x.ai |
| OpenRouter | `https://openrouter.ai/api/v1` | https://openrouter.ai/settings/keys |

OpenAI, Groq, Mistral, xAI, and OpenRouter use their OpenAI-compatible chat endpoints. Anthropic uses Messages streaming. Gemini uses `streamGenerateContent`. The provider catalog is refreshed with the user's key, so newly released or account-specific models appear without a redeploy.

## Local setup

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Open `/chat`, select the model button in the composer, open **API keys**, and add a key for the provider you want to use. Without Supabase, chats remain local to the browser and the dashboard is empty.

## Cloudflare

```bash
npx wrangler login
pnpm cf:build
pnpm cf:preview
pnpm cf:deploy
```

No provider secret is required in Cloudflare. If you enable Supabase, configure its public URL/anon key and service-role key through Cloudflare environment variables/secrets. Set `NEXT_PUBLIC_APP_URL` only if you want inference logs posted back to the deployed app.

The runtime uses Web-standard `fetch`, `ReadableStream`, and `AbortSignal` APIs, so provider requests work on Cloudflare Workers.
