# twc-www

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

## Database Setup

This project uses Supabase for the database. After setting up your Supabase project:

1. Run the migration to create the `users` table and add the foreign key to `images`:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_create_users_table.sql`
   - Run the migration

This will:
- Create a `users` table that links to `auth.users`
- Add a `user_id` foreign key column to the `images` table
- Set up Row Level Security policies
- Create necessary indexes

## Environment Variables

Make sure to set the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required for `/migrate` page)
- `CLOUDFLARE_WORKER_URL` - Your Cloudflare Worker URL for image uploads

## User Approval System

- Users sign up and are added to `waiting_approval` table
- Only users in the `users` table can access `/home`, `/feed`, and upload images
- Users not yet approved are redirected to `/waitlist`
- Admin (siddivishruth@gmail.com) can access `/migrate` to approve users

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
