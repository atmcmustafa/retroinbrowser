-- Share images (og/<slug>-<hash>.jpg) are drawn by scripts/og.ts before each deploy and live in
-- the artwork bucket next to covers and heroes. Share previews read JPEG everywhere; WebP isn't.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'covers';
