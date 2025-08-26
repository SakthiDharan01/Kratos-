# Database Migrations & Seeds

This folder contains SQL for setting up and seeding the Supabase (Postgres) database.

## Files
- `migrations/001_init.sql` – Creates core tables: users, events, registrations, registration_participants; adds RLS policies and helper function `upsert_user_profile`.
- `seeds/001_events_seed.sql` – Inserts initial event rows (idempotent: skips if name already exists).

## Applying to Supabase
You have two main options:

### Option 1: Supabase Dashboard
1. Open Supabase project → SQL Editor.
2. Paste contents of `migrations/001_init.sql` → Run.
3. Paste contents of `seeds/001_events_seed.sql` → Run.

### Option 2: Supabase CLI (Recommended for CI/CD)
```bash
# Login
supabase login
# Link project (once)
supabase link --project-ref YOUR_PROJECT_REF
# Generate migration folder structure if needed (already present here)
# Copy the SQL files into supabase/migrations if you use the default CLI layout.

# Apply migration (will run any new migrations)
supabase db push

# Manual seed (the CLI does not run seeds automatically)
psql "$(supabase db credentials get postgres_url)" -f db/seeds/001_events_seed.sql
```

Replace `YOUR_PROJECT_REF` with the ref from the project settings.

## Environment Variables Required (see `.env.example`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)

## RLS & Policies
Events: readable by anyone (anon + auth).
Users: a row is only visible/insertable/updatable by the authenticated owner (matched through `auth_user_id`).
Registrations & participants: visible/insertable/updatable only by the owning user (through joined lookup).

## Syncing OAuth Users
Call the SQL function after successful Google OAuth on the client (or via an Edge Function) to ensure a profile row exists:
```ts
await supabase.rpc('upsert_user_profile', { p_name: user.user_metadata.full_name, p_email: user.email, p_photo: user.user_metadata.avatar_url })
```

## Next Steps
- Add payment audit fields if needed (e.g., Razorpay signature, amount_paid).
- Add indexes for performance on reporting queries (e.g., created_at, category combos).
- Add admin role policies (e.g., role claim in JWT) for full read access.
