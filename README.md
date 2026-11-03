# Togetherly — Social Impact Events

A community events website built with Next.js, React, a separate Express server, and MongoDB. The code follows the reference projects: regular page components, direct API calls, reusable components, and backend routes in one `index.js`.

The backend follows the reference repository's flat application structure: `index.js`, `package.json`, `package-lock.json`, `.gitignore`, and `vercel.json`. All setup, collections, middleware, and routes are directly in `index.js`; there are no application factories, controllers, service layers, or route folders. The additional `.env.example` and `test/` folder provide setup instructions and automated checks. Togetherly's email/password sessions require a few authentication dependencies beyond the reference's token-verification-only server.

## Run locally

Use Node.js 22.13 or newer and npm. You need a MongoDB Atlas connection string or a local MongoDB server.

Install both projects from this folder:

```bash
npm install
npm --prefix server install
```

Create the environment files if they do not already exist. In PowerShell:

```powershell
Copy-Item .env.example .env.local
Copy-Item server/.env.example server/.env
```

Do not overwrite an existing configured `.env` file. During implementation, your original sibling server's environment file was copied into the ignored `server/.env`; the sibling server was left unchanged.

Frontend `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend `server/.env`:

```dotenv
MONGODB_URL=your-mongodb-connection-string
MONGODB_DB=togrtherly
PORT=8000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
COOKIE_CROSS_SITE=false
```

The database name intentionally preserves `togrtherly` from your original server. You can change `MONGODB_DB`. Only the Express server reads the database URL. Never put it in a `NEXT_PUBLIC_` variable.

Open two terminals in the project folder:

```bash
# Terminal 1: Express backend
npm run server
```

```bash
# Terminal 2: Next.js frontend
npm run dev
```

Visit **http://localhost:3000**. The API health response is at **http://localhost:8000**. Stop any older server using port 8000 first. Use `localhost` consistently rather than mixing it with `127.0.0.1`, since the application uses cookies and an allowed frontend origin.

**This workspace currently uses port 3001** because another project occupies port 3000. Its ignored `server/.env` has `CLIENT_URL=http://localhost:3001`. Start the frontend with `npm run dev -- --port 3001` and visit **http://localhost:3001/events/create** to create an event. If you change ports, update `CLIENT_URL` and restart Express.

The backend is an independent project in `server/`. You can also run `npm install` and `npm run dev` directly in that folder or move it to its own repository. It does not depend on the frontend source code. Your original `../togetherly-server` remains untouched; run the completed server in this project for these API routes.

## Start with real data

There are no seeded events, invented volunteer counts, or fallback event arrays.

1. Create an account at `/signup`.
2. Open **Create an event** and enter a title, type, public image URL, location, future date/time, duration, and description.
3. Publish the event. It is saved in MongoDB and appears on the homepage and Upcoming Events.
4. Use **My events** to edit or delete it.
5. Log out and create another account to test joining. Organizers cannot join their own events.
6. Use **Joined events** to find your registrations. Open an upcoming event to leave it.

An empty database displays helpful empty states and zero community counts. When the API is unavailable, the interface displays an error with a retry button.

## Pages and features

| Route               | Purpose                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `/`                 | Hero, database-backed community counts, participation steps, upcoming events, create-event call to action |
| `/events`           | Upcoming events, title/location search, type filter, sorting, pagination                                  |
| `/events/[id]`      | Event details, organizer, date/time, map link, join/leave, share link, organizer actions                  |
| `/events/create`    | Protected event creation form                                                                             |
| `/events/[id]/edit` | Protected organizer-only editing                                                                          |
| `/my-events`        | Your organized events; filter upcoming/past, edit, delete with confirmation                               |
| `/joined-events`    | Your registrations; filter upcoming/past                                                                  |
| `/impact`           | Live event, participant, location, and category counts                                                    |
| `/login`, `/signup` | Email/password accounts with persistent login                                                             |
| `/upcoming-event`   | Redirects for the original routes                                                                         |

The site includes responsive navigation, persistent light/dark mode, accessible form labels, keyboard focus styles, broken-image fallbacks, loading/error/empty states, and a newsletter subscription form.

Newsletter subscriptions are saved in MongoDB. Sending newsletters requires a mail provider and is not included. Accounts use email/password; there are no placeholder social-login or password-reset buttons.

## Project structure

```text
src/
  app/                  Next.js routes, layout, global styles
  components/
    HomePage/           Existing homepage components, extended with live data
    ui/                 Existing reusable button and card components
    AuthProvider.tsx    Current user and login session state
    AuthForm.tsx        Shared login/signup form
    EventBrowser.tsx    Search, filters, and pagination
    EventCard.tsx       Shared event card
    EventDetails.tsx    Event information and join/leave controls
    EventForm.tsx       Shared create/edit form
    PersonalEvents.tsx  Organized and joined event lists
    RequireAuth.tsx     Login prompt for private pages
  hooks/useApi.ts       Small fetch hook with loading, retry, and cancellation
  lib/api.ts            API URL, fetch helper, date formatting
  lib/types.ts          Types for API responses
server/
  index.js              Express setup, middleware, auth, routes, MongoDB connection
  vercel.json           Backend deployment configuration matching the reference
  .env.example          Backend environment variable template
  test/                 API tests and disposable browser-test server
public/image/           Existing Togetherly logo and hero image
tests/                  Browser tests
playwright.config.ts    Local browser-test configuration
```

`AuthProvider` shares the signed-in user across navigation and pages. `RequireAuth` provides a friendly login prompt; the backend independently checks permissions on every private request. `api()` sends the session cookie automatically. Components use `useApi()` for reads and `api()` in form handlers for writes.

## Backend API

All data is read or written through Express using the official MongoDB driver.

| Method | Endpoint           | Access / purpose                                                            |
| ------ | ------------------ | --------------------------------------------------------------------------- |
| GET    | `/`                | Health response                                                             |
| GET    | `/event-types`     | Supported event categories                                                  |
| POST   | `/auth/signup`     | Create an account and session                                               |
| POST   | `/auth/login`      | Create a session                                                            |
| GET    | `/auth/me`         | Current user or `null`                                                      |
| POST   | `/auth/logout`     | Invalidate session and clear cookie                                         |
| GET    | `/events`          | Upcoming events; `search`, `type`, `sort`, `page`, `limit` query parameters |
| GET    | `/events/:id`      | Event details and the viewer's joined state                                 |
| POST   | `/events`          | Signed-in user: create event                                                |
| PATCH  | `/events/:id`      | Organizer: update a future event                                            |
| DELETE | `/events/:id`      | Organizer: delete event and its signups                                     |
| POST   | `/events/:id/join` | Signed-in non-organizer: join a future event                                |
| DELETE | `/events/:id/join` | Signed-in participant: leave a future event                                 |
| GET    | `/my-events`       | Current user's organized events                                             |
| GET    | `/joined-events`   | Current user's joined events                                                |
| GET    | `/stats`           | Counts and categories calculated from MongoDB                               |
| POST   | `/newsletter`      | Save a unique email subscription                                            |

Write requests must include an `Origin` header matching `CLIENT_URL`. Browser requests do this automatically. For Postman or curl, set the header explicitly and retain the login cookie for protected routes.

MongoDB collections:

- `users`: name, normalized unique email, bcrypt password hash, creation date.
- `sessions`: hashed random token, user ID, expiry. A TTL index removes expired sessions.
- `events`: event fields, server-assigned organizer, participant IDs, creation/update dates.
- `subscribers`: normalized unique email and subscription date.

Dates are stored as MongoDB dates in UTC. Forms accept the user's local date/time and convert it to UTC before sending. Details are displayed in the viewer's local timezone. Upcoming events must have a future start time. An event's participant list uses MongoDB `$addToSet`, so repeated or concurrent joins cannot add duplicate participants. Public responses contain counts rather than private participant IDs.

The impact page counts unique participants, distinct location strings, all current event records, and events whose start time has passed. These are not independently verified attendance or lifetime impact totals; deleting an event removes it from the counts.

## Checks

```bash
# Production build, including Next.js TypeScript checks
npm run build

# API integration tests against a disposable MongoDB instance
npm test

# Browser tests against disposable data on ports 3010 and 8010
npm run test:e2e

# Format application and test code
npm run format
```

The first API/browser test run may download a MongoDB test binary. Tests never use `MONGODB_URL` for their database. Browser tests use installed Microsoft Edge in headless mode and cover signup, login, create/edit/delete, search/filter, join/leave, persistent sessions, mobile overflow, dark mode, newsletter subscription, and network-error recovery. Screenshots and traces are written to ignored `test-results/`.

For systems without Edge, install a Playwright browser and change `channel: "msedge"` in `playwright.config.ts` to `channel: "chromium"`:

```bash
npx playwright install chromium
```

## Production configuration

Build and run the frontend with `npm run build` and `npm start`. Start the independent backend with `npm start` from `server/`.

Set `NEXT_PUBLIC_API_URL` before building the frontend. Set `CLIENT_URL` to the exact frontend origin, with no trailing slash, and use HTTPS with `NODE_ENV=production` for secure session cookies. If the frontend and API are on different sites, set `COOKIE_CROSS_SITE=true`; both must use HTTPS, and browser third-party-cookie restrictions can still apply. Hosting them under the same site avoids that restriction.

Authentication and newsletter endpoints have basic rate limiting. Passwords are hashed, cookies are HttpOnly, sessions are revocable, write origins are checked, IDs and fields are validated, and organizer permissions are enforced on the server. When adding a reverse proxy or multiple backend instances, configure trusted proxy handling and a shared rate-limit store for that deployment.

MongoDB Atlas must allow your backend's IP address. Environment files are ignored by Git, while the credential-free examples are tracked.

## Design reference and current verification limit

The existing Togetherly logo, hero image, green/cream palette, and homepage/form styling were retained and extended across the working pages. The Figma connector returned an account usage-limit error before any screen context or screenshots could be retrieved. Therefore, the entire Figma file could not be inspected and exact visual parity or coverage of unseen screens is not verified. Exported screens or restored Figma access are needed for that comparison.

Coding references reviewed:

- https://github.com/ProgrammingHero1/b14-wanderlust-client
- https://github.com/ProgrammingHero1/b14-wanderlust-server
- https://www.figma.com/design/sFlpJuCMo2vmPjituPZtBv/Togetherly-%E2%80%94-Social-Impact-Events-%7C-Complete-UI-UX?node-id=0-1
