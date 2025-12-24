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

4. Create `deleted_thoughts` table and remove `deleted` column from `thoughts` table:
   - Go to your Supabase Dashboard → SQL Editor
   - Run the following SQL:
   ```sql
   -- Create deleted_thoughts table for storing deleted thoughts
   CREATE TABLE IF NOT EXISTS deleted_thoughts (
     id UUID PRIMARY KEY,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL,
     user_id UUID NOT NULL REFERENCES users(id),
     deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   
   -- Remove the deleted column from thoughts table (no longer needed)
   ALTER TABLE thoughts DROP COLUMN IF EXISTS deleted;
   
   -- Enable RLS on deleted_thoughts table
   ALTER TABLE deleted_thoughts ENABLE ROW LEVEL SECURITY;
   
   -- Allow authenticated users to insert their own deleted thoughts
   CREATE POLICY "Users can insert their own deleted thoughts"
     ON deleted_thoughts
     FOR INSERT
     TO authenticated
     WITH CHECK (
       user_id IN (
         SELECT id FROM users WHERE auth_user_id = auth.uid()
       )
     );
   
   -- Allow users to view their own deleted thoughts (for potential future features)
   CREATE POLICY "Users can view their own deleted thoughts"
     ON deleted_thoughts
     FOR SELECT
     TO authenticated
     USING (
       user_id IN (
         SELECT id FROM users WHERE auth_user_id = auth.uid()
       )
     );
   ```

This will:
- Create a `users` table that links to `auth.users`
- Add a `user_id` foreign key column to the `images` table
- Set up Row Level Security policies
- Create necessary indexes
- Enable RLS on `waiting_approval` and `images` tables with appropriate policies
- Create `deleted_thoughts` table for storing deleted thoughts (deleted thoughts are moved here instead of being soft-deleted)

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
