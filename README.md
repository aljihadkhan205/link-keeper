# Link Keeper — Personal Link Manager

**Link Keeper** is a modern, high-performance personal link and bookmark management web application built with React, TypeScript, Tailwind CSS, an Express/Vercel serverless REST API, and persistent SQLite database integration via the official **Turso / libSQL** client.

Designed with a sleek, dark dashboard aesthetic (`#0B0D0F`, `#15191C`, lime accent `#D7FF64`), Link Keeper allows you to save, categorize, instantly search, and track your bookmarks with automated **Recently Viewed** ranking.

---

## Key Features

1. **Persistent Database Storage**:
   - Integrates with **Turso hosted SQLite** via the `@libsql/client` SDK.
   - Out-of-the-box local fallback mode using an embedded SQLite file (`./data/linkkeeper.db`) for immediate zero-config development.
   - 100% parameterized queries to protect against SQL injection.
2. **True Recently Viewed Tracking**:
   - Each click to open a link immediately calls `POST /api/links/:id/view` to update `last_viewed_at`.
   - The link moves to the top of the **Recently Viewed** list immediately.
   - `created_at` and `updated_at` timestamps are strictly preserved.
3. **Multi-Stage Website Favicons**:
   - Automatically derives website favicons from the domain name using Google's public high-res favicon service and direct domain fallbacks.
   - Graceful fallback to a styled globe SVG icon if a favicon cannot be resolved, ensuring no broken images or layout shifts.
4. **Instant Search & Category Filtering**:
   - Case-insensitive search across website names, URLs, notes, and categories without page reload.
   - Segmented categories: *AI Tools, Development, Design, Social Media, Education, Productivity, Personal, Other*.
   - Inline creation of custom categories on the fly.
5. **Private Access & Server Security**:
   - Server-enforced passcode lock protecting all read, write, update, view, and export endpoints.
   - Set `PRIVATE_ACCESS_PIN` and `SESSION_SECRET` in `.env` / Vercel env vars (required in production, no built-in defaults).
   - Cryptographically signed HTTP-only session cookie (`lk_session`) with HMAC-SHA256.
   - Rate limiting for repeated failed passcode attempts.
6. **JSON Export & Database Backup**:
   - One-click instant JSON export with complete bookmark metadata and timestamps.
   - Detailed Turso disaster recovery commands (`turso db dump` / `turso db shell`).
7. **Responsive & Accessible**:
   - Compact List Row and Grid Card view modes.
   - Fully optimized for desktop, tablet, and mobile with no horizontal overflow.

---

## Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Express (Node.js dev server on port 3000) & Vercel Serverless Function architecture (`api/*`)
- **Database**: Turso Cloud libSQL / SQLite with `@libsql/client`
- **Authentication**: HTTP-only secure cookies with server HMAC signing

---

## Project Structure

```
link-keeper/
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── status.ts
│   ├── categories/
│   │   └── index.ts
│   ├── links/
│   │   ├── index.ts
│   │   ├── [id].ts
│   │   └── [id]/
│   │       └── view.ts
│   ├── export.ts
│   └── _lib/
│       ├── auth.ts
│       ├── database.ts
│       └── validation.ts
├── database/
│   └── schema.sql
├── src/
│   ├── components/
│   │   ├── AccessModal.tsx
│   │   ├── AddLinkModal.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ExportModal.tsx
│   │   ├── Header.tsx
│   │   ├── LinkCard.tsx
│   │   └── SortAndViews.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── favicon.ts
│   │   └── formatDate.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── .env.example
├── package.json
├── server.ts
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## Getting Started & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If you do not configure Turso credentials right away, Link Keeper will automatically initialize an embedded SQLite database at `./data/linkkeeper.db`.

To connect your remote Turso cloud database:
```env
TURSO_DATABASE_URL="libsql://your-database-name-org.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"
PRIVATE_ACCESS_SECRET="your_strong_passcode"
SESSION_SECRET="your_random_cookie_signing_secret"
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Turso Database Setup Guide

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Log in and create a database:
   ```bash
   turso auth login
   turso db create link-keeper
   ```
3. Retrieve your database URL and Auth Token:
   ```bash
   turso db show link-keeper --url
   turso db tokens create link-keeper
   ```
4. Initialize the schema:
   ```bash
   turso db shell link-keeper < database/schema.sql
   ```
5. Add the URL and token to your `.env` or Vercel environment variables.

---

## Vercel Deployment Instructions

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Link Keeper application"
   git push origin main
   ```
2. Import the repository into [Vercel](https://vercel.com).
3. Set the Framework Preset to **Vite**.
4. In the Project Settings -> **Environment Variables**, add:
   - `TURSO_DATABASE_URL`: `libsql://your-db.turso.io`
   - `TURSO_AUTH_TOKEN`: your token
   - `PRIVATE_ACCESS_PIN`: your personal website access PIN (e.g. `45684522`)
   - `SESSION_SECRET`: a random secret string for session cookies (e.g., generated with `openssl rand -hex 32`)
   - `PRIVATE_ACCESS_SECRET`: optional secondary server key for API access
5. Click **Deploy**. Vercel will build the frontend into `dist/` and route `/api/*` requests to the serverless functions in the `api/` directory.

---

## Verification & Testing Checklist

- [x] **Adding a link**: Saves URL, name, note, category, and favorite status to SQLite/Turso.
- [x] **Browser refresh**: Preserves all saved links and category assignments.
- [x] **Multi-device sync**: When connected to Turso Cloud, links are synced across devices.
- [x] **Recently Viewed updates**: Clicking a link calls `POST /api/links/:id/view`, updates `last_viewed_at`, and moves the link to the top of Recently Viewed.
- [x] **Recently Added sort**: Ordered strictly by `created_at DESC`.
- [x] **Editing a link**: Updates `name`, `url`, `note`, `category`, and `is_favorite` while preserving original `created_at` and `last_viewed_at`.
- [x] **Search**: Case-insensitive filtering across name, URL, note, and category.
- [x] **Favicon fallback**: Resolves Google favicon CDN and falls back gracefully to SVG globe icon on load error.
- [x] **Favorites toggle**: Persists immediately with optimistic UI updates.
- [x] **Delete confirmation**: Modal confirmation prevents accidental deletion and deletes only the selected record.
- [x] **URL validation**: Enforces HTTP/HTTPS protocol and valid domains.
- [x] **Private Access**: Unauthenticated requests to `/api/*` receive 401 Unauthorized; passcode unlock sets signed HTTP-only cookie.
- [x] **JSON Export**: Downloads clean `link-keeper-backup-YYYY-MM-DD.json` containing complete link metadata.
- [x] **Responsive Layout**: Fluid layouts across desktop (1440px), tablet, and mobile viewports with no horizontal overflow.
