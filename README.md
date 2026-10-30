# T7 Chat

> 📌 [How It Worked](How%20It%20Worked.md) 

![alt text](public/hero.png)


## Run locally

Requirements: Node.js 20+, pnpm, and a Supabase project with Email/Password authentication enabled.

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Open [http://localhost:3000/chat](http://localhost:3000/chat).

Add these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Apply the SQL files in `supabase/migrations/` in filename order. Provider keys are added through the app and should not be committed to the repository.

## Checks

```bash
pnpm lint
pnpm test
pnpm build
```

## Cloudflare deployment

For a manual Cloudflare Workers deployment, use:

```bash
pnpm cf:build
npx wrangler deploy
```

Add the Supabase URL, Supabase anon key, service-role key, encryption key, and production app URL as Worker variables/secrets.

## License

MIT License · Built by [Ankesh Singh](https://github.com/Ankesh-Singh)
