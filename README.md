# HAL Tejas Outsourcing: web frontend

Next.js (React, JavaScript, Tailwind CSS). One site with two separate entrances:

| Address | Who | Look |
| --- | --- | --- |
| `/staff/login` | HAL departments, committees, inspection, gate, finishing, administrator | Blue |
| `/vendor/login` | Vendors that hold an approved order | Green |

It needs the backend API (a separate project) to be running and reachable.

## How it talks to the backend

The browser only ever talks to this site. The site's server forwards requests to the backend (`/api/internal/*` and
`/api/vendor/*`) and keeps the login tokens in httpOnly cookies, one pair per entrance, so no token is visible to page
scripts. Consequences:

* `BACKEND_URL` must be reachable **from this server**, not from the user's browser.
* The backend needs no CORS setup.
* Add this server's view of the backend host name to the backend's `DJANGO_ALLOWED_HOSTS`.

## Settings

| Variable | Example | Meaning |
| --- | --- | --- |
| `BACKEND_URL` | `http://127.0.0.1:8765` | Backend API address as seen from this server. Required. |
| `COOKIE_SECURE` | `true` | `true` in production behind HTTPS. `false` only for plain `http://localhost`. |
| `WEB_PORT`, `WEB_BIND` | `3000`, `0.0.0.0` | Docker only: published port and interface. |

## Run for development

```bash
npm install
cp .env.example .env.local      # set BACKEND_URL
npm run dev                     # http://localhost:3000
```

## Run with Docker

```bash
cp .env.example .env            # set BACKEND_URL and COOKIE_SECURE
docker compose up -d --build    # http://localhost:3000
```

| Backend is | `BACKEND_URL` |
| --- | --- |
| on this machine, published on the host | `http://host.docker.internal:8765` |
| on another server | `http://<backend-host>:8765` |
| in a container on the same Docker network | `http://<service-name>:8000` |

For a server, put a TLS-terminating reverse proxy in front of port 3000 and keep `COOKIE_SECURE=true`.
`BACKEND_URL` is read when the container starts, so changing it only needs `docker compose up -d`, not a rebuild.

## Deploy on Cloudflare Workers

The site also runs on Cloudflare Workers through the OpenNext adapter (`wrangler.jsonc`, `open-next.config.ts`).
Connect the repository in Cloudflare with the default commands:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (runs the OpenNext build) |
| Deploy command | `npx wrangler deploy` |
| Worker name | `hal-outsourcing-frontend` (must equal `name` in `wrangler.jsonc`) |

The Worker's settings are in `wrangler.jsonc` under `vars`: `BACKEND_URL` (use the HTTPS address of the API) and
`COOKIE_SECURE`. Change them there and push; a value set only in the dashboard is replaced on the next deploy.

Do not enable Next.js "Cache Components" (`cacheComponents`): it does not run correctly on the Workers runtime.
On Windows, build with `npm run build:next` (the OpenNext build needs Linux); Cloudflare's builder runs on Linux.

## Build and checks

```bash
npm run lint
npm run build:next      # plain Next.js build (used by the Docker image)
```

## Layout

| Path | Contents |
| --- | --- |
| `app/api/[...path]/route.js` | The server-side proxy and cookie handling |
| `app/staff/`, `app/vendor/` | The two sites |
| `components/ActionPanel.js` | The forms behind each workflow button |
| `components/Shell.js` | Sign-in guard, navigation and theme |
