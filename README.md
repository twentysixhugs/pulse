# PulseScalp Mini App

This project is a Next.js mini app designed to run inside Telegram WebApps for
three roles: user, trader, and admin. Authentication happens exclusively via
Telegram using Firebase custom tokens issued by the backend.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (create `.env.local`):

   ```bash
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.example.com
   # Optional: static init data for local testing outside Telegram
   # NEXT_PUBLIC_TG_STATIC_INIT_DATA=...raw init data string...
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   To run with an automatically managed Cloudflare tunnel (recommended when the
   app needs to be reachable from Telegram), use:

   ```bash
   npm run dev:tunnel
   ```

   This command starts the Next.js dev server, launches Cloudflare Tunnel, and
   stores the public URL in `.frontend_tunnel_url` at the project root for easy
   reference.

The app determines the expected role from the current route (`/` → user,
`/trader` → trader, `/admin` → admin) and calls the backend endpoint
`POST /auth/telegram` with the Telegram WebApp `initData`. The backend verifies
the signature, issues a Firebase custom token, and synchronises the user
document in Firestore (`users/{uid}`) with a `roles` array, `paymentStatus`, and
other metadata.

The frontend signs in with the custom token, listens to the `users/{uid}`
document, and gates access based on `roles` and `paymentStatus`. Error states
surface a retry option that re-runs the Telegram handshake.
