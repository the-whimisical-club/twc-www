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

1. Create the `users` table and set up initial database schema
2. Enable Row Level Security (RLS) on required tables
3. Set up RLS policies for authenticated users

4. Create the `library` table for community movie/TV library
   - Note: The `tmdb_id` column should be TEXT (not INTEGER) to support both TMDb numeric IDs and OMDB string IDs (imdbID)
5. Create `deleted_thoughts` table and set up soft-delete pattern

The database setup includes:
- User management tables with authentication integration
- Row Level Security policies for data access control
- Indexes for optimized queries
- Library table for community content
- Soft-delete pattern for user-generated content

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
- `TMDB_API_KEY` - Your TMDb (The Movie Database) API key (required for `/medialib` page)
- `OMDB_API_KEY` - Your OMDB (Open Movie Database) API key (optional, for fallback search)

## User Approval System

- Users sign up and are added to `waiting_approval` table
- Only users in the `users` table can access `/home`, `/feed`, and upload images
- Users not yet approved are redirected to `/waitlist`
- Admins can access `/migrate` to approve users

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
