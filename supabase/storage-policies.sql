-- Run after creating bucket "indies" in Supabase Storage (public bucket)

-- Authenticated users can upload to their own folder
create policy "indies_auth_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'indies'
  and (storage.foldername(name))[1] in ('maps', 'covers')
);

-- Public read for all files in indies bucket
create policy "indies_public_read"
on storage.objects for select
to public
using (bucket_id = 'indies');

-- Users can delete their own uploads
create policy "indies_auth_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'indies'
  and auth.uid()::text = (storage.foldername(name))[2]
);