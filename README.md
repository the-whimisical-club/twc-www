# twc-www

## Installation

### Node.js Dependencies

```bash
bun install
```

### Python Dependencies

Image processing is handled by a Python script. Set up a virtual environment and install dependencies:

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Or install Pillow directly:

```bash
pip install Pillow
```

**Note**: The virtual environment is automatically used by the server. You don't need to activate it manually when running the app.

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

This will:
- Create a `users` table that links to `auth.users`
- Add a `user_id` foreign key column to the `images` table
- Set up Row Level Security policies
- Create necessary indexes

## Image Processing

Image processing is handled server-side by a Python script (`scripts/process_image.py`) using Pillow:

- **Resolution check**: Images must be at least 1080p (1920x1080)
- **Auto-rotation**: Handles EXIF orientation (fixes iOS image rotation)
- **Resizing**: Images larger than 4K (3840x2160) are resized down to 4K
- **Format conversion**: All images are converted to JPEG format

The Python script:
- Reads image data from stdin
- Processes the image
- Outputs JPEG to stdout

All processing logic is in Python - the client just uploads the original file.

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
