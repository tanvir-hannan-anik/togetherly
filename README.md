# Togetherly — Social Impact Events

A community-service events site. Organizers post cleanups, plantations and donation drives; volunteers browse upcoming events and join them.

- **Client:** Next.js 16 (App Router) + React 19, styled with Tailwind and plain CSS.
- **Auth:** [better-auth](https://www.better-auth.com/) in the Next.js app: email/password and GitHub login, stored in MongoDB.
- **Server:** a small Express 5 API in `server/index.js` backed by MongoDB.

The structure follows the reference projects [b14-wanderlust-client](https://github.com/ProgrammingHero1/b14-wanderlust-client) and [b14-wanderlust-server](https://github.com/ProgrammingHero1/b14-wanderlust-server).

## How authentication works

1. better-auth runs inside Next.js at `/api/auth/*` (`src/lib/auth.ts`). It stores users, sessions and accounts in MongoDB and signs JWTs with the `jwt()` plugin.
2. Client code asks better-auth for a short-lived JWT (`src/lib/getTokenFromClient.ts`). `api()` in `src/lib/api.ts` sends it as `Authorization: Bearer <token>`.
3. The Express server verifies the token against the app's public keys at `${CLIENT_URL}/api/auth/jwks` using `jose`. Protected routes return `401` without a valid token.
4. `src/proxy.ts` (Next.js 16's renamed middleware) redirects logged-out visitors from private pages to `/login?next=…`.

## Run locally

Requires Node.js 22+ and a MongoDB connection string (Atlas or local).

```bash
npm install
npm --prefix server install
```

### Environment

Copy the examples, then fill in the values:

```powershell
Copy-Item .env.example .env.local
Copy-Item server/.env.example server/.env
```

`.env.local` (Next.js app):

```dotenv
MONGODB_URI=your-mongodb-connection-string
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=long-random-string        # npx @better-auth/cli secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`server/.env` (Express API):

```dotenv
MONGODB_URI=your-mongodb-connection-string
CLIENT_URL=http://localhost:3000
PORT=8000
```

Both sides use the `togetherly` database. `CLIENT_URL` must be the exact origin the Next.js app runs on: it is used for CORS and for fetching the JWT signing keys.

### GitHub login

Create an OAuth App at **GitHub → Settings → Developer settings → OAuth Apps** with:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Put its Client ID and a generated Client Secret in `.env.local`.

### Start

```bash
npm run server   # Express API on http://localhost:8000
npm run dev      # Next.js on http://localhost:3000
```

## Pages

| Route               | Access  | Purpose                                                                         |
| ------------------- | ------- | ------------------------------------------------------------------------------- |
| `/`                 | Public  | Banner, community stats, 6 soonest upcoming events, gallery, newsletter         |
| `/events`           | Public  | All upcoming events with search, type filter and sort                           |
| `/events/[id]`      | Public  | Event details; logged-in users can join or leave; organizers can edit or delete |
| `/events/create`    | Private | Create an event (future dates only); redirects to Upcoming Events with a toast  |
| `/events/[id]/edit` | Private | Organizer-only editing                                                          |
| `/my-events`        | Private | Manage your events: edit or delete                                              |
| `/joined-events`    | Private | Events you joined, sorted by date                                               |
| `/profile`          | Private | Update your display name and photo                                              |
| `/impact`           | Public  | Live community counts                                                           |
| `/login`, `/signup` | Public  | Email/password or GitHub login; register takes name, email, photo URL, password |

Passwords must contain an uppercase letter, a lowercase letter and at least 6 characters. Login, register and form errors show toasts. The navbar has a light/dark toggle and, when logged in, an avatar (hover shows your name) with a dropdown for Create Event, Manage Events, Joined Events and My Profile.

## API (`server/index.js`)

🔒 = requires `Authorization: Bearer <better-auth JWT>`.

| Method | Endpoint              | Purpose                                                           |
| ------ | --------------------- | ----------------------------------------------------------------- |
| GET    | `/`                   | Health check                                                      |
| GET    | `/event-types`        | `Cleanup`, `Plantation`, `Donation`, `Other`                      |
| GET    | `/events`             | Upcoming events; optional `search`, `type`, `sort`, `limit` (≤50) |
| GET    | `/events/:id`         | Event details (`joined` reflects the caller if a token is sent)   |
| POST   | `/events` 🔒          | Create an event; organizer name/email come from the token         |
| PATCH  | `/events/:id` 🔒      | Organizer only, upcoming events only                              |
| DELETE | `/events/:id` 🔒      | Organizer only                                                    |
| POST   | `/events/:id/join` 🔒 | Join an upcoming event (not your own)                             |
| DELETE | `/events/:id/join` 🔒 | Leave an upcoming event                                           |
| GET    | `/my-events` 🔒       | Events you organize                                               |
| GET    | `/joined-events` 🔒   | Events you joined, soonest first                                  |
| GET    | `/stats`              | Counts used on the home and impact pages                          |
| POST   | `/newsletter`         | Save a newsletter email                                           |

Event input is validated on the server: title, type, location, description length, an http(s) thumbnail URL, a duration of 0.5–24 hours, and a date in the future.

## Project structure

```text
src/
  app/                    Routes, layout, global styles, /api/auth handler
  components/
    home/                 banner, featured, upcoming-events, gallery, newsletter
    event/                event-card, events-grid, event-details, event-form, edit-event, delete-event-dialog, event-image
    ui/                   shadcn button and card
    navbar.tsx  footer.tsx  auth-form.tsx  profile-form.tsx  personal-events.tsx  impact.tsx  feedback.tsx  welcome-toast.tsx
  hooks/use-api.ts        Fetch hook with loading, error and retry
  lib/                    auth.ts, auth-client.ts, getTokenFromClient.ts, api.ts, types.ts
  proxy.ts                Redirects logged-out visitors from private pages
server/
  index.js                Express app: MongoDB, JWT verification, all routes
  vercel.json             Deployment config
public/image/             Logo, hero image, gallery/ photos
```

## Checks

```bash
npm run build   # production build with type checking
npm run lint
```
