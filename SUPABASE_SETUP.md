# Supabase Storage Setup for Collaborative Song & Video Management

## Problem
Currently getting error: `new row violates row-level security policy`

This means the Supabase Storage buckets have Row Level Security enabled but no policies allow uploads.

This affects both:
- **songs** bucket (for lyrics files)
- **videos** bucket (for background videos)

## Solution

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `klyzfudqwhklsermoxcd`
3. Go to **Storage** → **Buckets** → **songs**
4. Click on **Policies** tab
5. Click **New Policy**
6. Select **Full customization**
7. Create the following policies:

#### Policy 1: Allow Public Uploads
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'songs');
```

#### Policy 2: Allow Public Reads
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'songs');
```

#### Policy 3: Allow Public Updates (for overwriting)
```sql
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'songs')
WITH CHECK (bucket_id = 'songs');
```

#### Policy 4: Allow Public Deletes (optional)
```sql
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'songs');
```

### Option 2: Via SQL Editor (Recommended for Both Buckets)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- ========== SONGS BUCKET POLICIES ==========

-- Allow public uploads to songs bucket
CREATE POLICY "Allow public uploads songs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'songs');

-- Allow public reads from songs bucket
CREATE POLICY "Allow public reads songs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'songs');

-- Allow public updates to songs bucket (for overwriting files)
CREATE POLICY "Allow public updates songs"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'songs')
WITH CHECK (bucket_id = 'songs');

-- Allow public deletes from songs bucket (optional)
CREATE POLICY "Allow public deletes songs"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'songs');

-- ========== VIDEOS BUCKET POLICIES ==========

-- Allow public uploads to videos bucket
CREATE POLICY "Allow public uploads videos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

-- Allow public reads from videos bucket
CREATE POLICY "Allow public reads videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Allow public updates to videos bucket
CREATE POLICY "Allow public updates videos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Allow public deletes from videos bucket
CREATE POLICY "Allow public deletes videos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'videos');
```

## Security Notes

⚠️ **Important**: These policies allow ANYONE with your `SUPABASE_ANON_KEY` to upload/read/update/delete songs.

For production use with a worship team, you should:

1. **Enable Authentication**: Require users to sign in
2. **Use Auth Policies**: Replace `TO public` with `TO authenticated`
3. **Add User Tracking**: Store `auth.uid()` in metadata to track who uploaded what

### Example: Auth-Protected Policy

```sql
-- Only allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs');
```

## Verification

After setting up policies, test by searching for a new song in the app. You should see:
```
☁️ Saved to Supabase Storage
```

Without any errors!

## Collaborative Workflow

Once set up, your worship team can:

1. **Search & Add Songs**: Anyone with the app can search for songs
2. **Auto-Sync**: Songs automatically upload to Supabase Storage
3. **Shared Library**: All team members see the same song library
4. **Offline Capable**: Local cache works even when offline
5. **Bi-directional Sync**: Run sync commands to keep all devices updated

### Sync Commands (via IPC)

The app already has these functions in `main/helpers/supabase-sync.ts`:

- `syncLocalToSupabase()` - Upload all local songs to cloud
- `syncSupabaseToLocal()` - Download all cloud songs locally
- `syncBidirectional()` - Two-way sync (smart merge)

You can trigger these from the UI by adding buttons that call:
```typescript
api?.syncLocalToSupabase();
api?.syncSupabaseToLocal();
```

## Current Status

✅ Code is ready for collaborative use
❌ Supabase Storage RLS policies need to be configured
✅ Local caching works perfectly
✅ Bi-directional sync functions implemented

Once you set up the RLS policies, the entire system will work seamlessly for your worship team! 🎵
