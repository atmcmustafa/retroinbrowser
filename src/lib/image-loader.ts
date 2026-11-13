"use client";

// Cloudflare resizes images at the edge (/cdn-cgi/image/<options>/<source> on our own zone) and
// its CDN keeps the results, so a view costs neither a Worker request nor Supabase egress. The
// zone needs Images > Transformations on, with the Supabase host allowed as a source. Local
// development has no zone, so it loads the stored file as is.
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (process.env.NODE_ENV === "development") return src;
  const options = `width=${width},quality=${quality ?? 75},format=auto`;
  return `${process.env.NEXT_PUBLIC_SITE_URL}/cdn-cgi/image/${options}/${src}`;
}
