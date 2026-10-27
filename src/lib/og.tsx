import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import sharp from "sharp";
import { brandColors, gamepadLines, gamepadPath } from "@/lib/brand";

// Satori needs static TTFs; see assets/fonts/README.md. Traced via next.config.ts.
const fontDir = join(process.cwd(), "assets/fonts");
const [archivo, interRegular, interSemiBold] = await Promise.all([
  readFile(join(fontDir, "Archivo-Expanded-ExtraBold.ttf")),
  readFile(join(fontDir, "Inter-Regular.ttf")),
  readFile(join(fontDir, "Inter-SemiBold.ttf")),
]);

export const ogSize = { width: 1200, height: 630 };

export const ogFonts = [
  { name: "Archivo", data: archivo, weight: 800, style: "normal" },
  { name: "Inter", data: interRegular, weight: 400, style: "normal" },
  { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
] as const;

export function Wordmark({ fontSize }: { fontSize: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: fontSize * 0.45 }}>
      <svg
        width={fontSize * 1.15}
        height={fontSize * 1.15}
        viewBox="0 0 24 24"
        fill="none"
        stroke={brandColors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {gamepadLines.map((line, index) => (
          <line key={index} {...line} />
        ))}
        <path d={gamepadPath} />
      </svg>
      <div
        style={{
          fontFamily: "Archivo",
          fontSize,
          letterSpacing: "-0.02em",
          color: brandColors.foreground,
        }}
      >
        RetroInBrowser
      </div>
    </div>
  );
}

export function BrandCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: brandColors.background,
        fontFamily: "Inter",
      }}
    >
      <Wordmark fontSize={40} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: "Archivo",
            fontSize: 92,
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            color: brandColors.foreground,
          }}
        >
          Classic games, in your browser.
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: brandColors.muted }}>
          Browser ports of classic games, linking straight to each port.
        </div>
      </div>
      <div style={{ width: 120, height: 6, borderRadius: 3, background: brandColors.accent }} />
    </div>
  );
}

// Stored artwork is WebP, which Satori doesn't decode reliably; hand it a JPEG instead.
// Uploads get a new file name each time, so a URL's image never changes: cache for good.
export async function jpegDataUrl(url: string, width: number, height: number) {
  "use cache";
  cacheLife("max");
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(width, height, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("OG artwork failed", url, error);
    return null;
  }
}
