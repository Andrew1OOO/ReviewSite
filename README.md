# Drew's Caesar Wraps

A rigorous, opinionated ranking platform for chicken Caesar wraps. Every wrap is scored on five axes — chicken, sauce, integrity, balance, and value — and assigned a composite score and tier badge.

## Stack

- **Next.js** (App Router, TypeScript)
- **Supabase** (Postgres, Auth, Storage)
- **Tailwind CSS**
- **Vercel** (deployment)

---

## Setup

### Step 0: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project**, fill in name and password, choose a region close to you.
3. Wait ~2 minutes for the project to provision.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 1: Run the database migration

1. In your Supabase project, go to **SQL Editor**.
2. Open `supabase/migration.sql` from this repo.
3. Paste the entire file contents and click **Run**.

This creates all tables, RLS policies, the `wrap_scores` view, and the Storage buckets.

### Step 2: Configure Supabase Auth

1. In Supabase, go to **Authentication → URL Configuration**.
2. Add your local dev URL to **Site URL**: `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**.
4. (For production, also add your Vercel URL to both.)

### Step 3: Get a Google Maps API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a project, enable the **Places API** and **Maps JavaScript API**.
3. Create an API key and copy it → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
4. Restrict the key to your domain(s) when you deploy.

### Step 4: Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Step 5: Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your repo.
3. In the **Environment Variables** section, add the same three variables from `.env.local`.
4. Click **Deploy**.
5. After deploy, go back to Supabase → **Authentication → URL Configuration** and add your Vercel URL (`https://your-app.vercel.app`) to **Site URL** and **Redirect URLs**.

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    page.tsx            # Home (top-ranked wraps)
    rankings/           # Full ranked list
    submit/             # Submit a new wrap
    wraps/[id]/         # Wrap detail page
      review/           # Add a review
      review/edit/      # Edit your review + manage photos
    signin/             # Magic link sign in
    auth/callback/      # Supabase auth callback
  components/           # Shared UI components
  lib/
    actions/            # Server actions (auth, wraps, reviews, comments)
    supabase/           # Supabase client (browser + server)
    types.ts            # TypeScript types
supabase/
  migration.sql         # Full database migration
```

---

## Phase 2 (not yet implemented)

- Map view of wrap locations
- City leaderboards
- Filtering by tier, city, chain
- User profiles and follow system
- Admin moderation tools
- Chain location grouping
