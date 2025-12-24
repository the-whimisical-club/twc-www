# twc-www

## Installation

### Node.js Dependencies

```bash
bun install
```


## Running

```bash
bun run dev
```

## Database Setup

This project uses Supabase for the database. After setting up your Supabase project:

1. Run the migration to create the `users` table and add the foreign key to `images`:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_create_users_table.sql`
   - Run the migration

2. Enable Row Level Security (RLS) on `waiting_approval` and `images` tables:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/002_enable_rls_policies.sql`
   - Run the migration

3. Optimize existing RLS policies for better performance:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase/migrations/003_optimize_rls_policies.sql`
   - Run the migration

This will:
- Create a `users` table that links to `auth.users`
- Add a `user_id` foreign key column to the `images` table
- Set up Row Level Security policies
- Create necessary indexes
- Enable RLS on `waiting_approval` and `images` tables with appropriate policies

## Image Processing

Image processing is handled server-side using Sharp (Node.js image processing library):

- **Resolution check**: Images must be at least 1080p (1920x1080)
- **Auto-rotation**: Handles EXIF orientation (fixes iOS image rotation)
- **Resizing**: Images larger than 4K (3840x2160) are resized down to 4K
- **Format conversion**: Non-JPEG images are converted to JPEG format
- **JPEG passthrough**: JPEG/JPG files that don't need resizing pass through efficiently (EXIF still handled)

All processing logic is server-side - the client just uploads the original file.

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
