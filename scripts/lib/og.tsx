import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { badgeLabelsFor } from "@/lib/game-badge-labels";
import { brandColors, gamepadLines, gamepadPath } from "@/lib/brand";
import { ogImageSize, type OgGame } from "@/lib/og-image";

// Satori needs static TTFs; see assets/fonts/README.md.
const fontDir = join(process.cwd(), "assets/fonts");
const font = (file: string) => readFileSync(join(fontDir, file));

const ogSize = ogImageSize;

const ogFonts = [
  { name: "Archivo", data: font("Archivo-Expanded-ExtraBold.ttf"), weight: 800, style: "normal" },
  { name: "Inter", data: font("Inter-Regular.ttf"), weight: 400, style: "normal" },
  { name: "Inter", data: font("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
] as const;

function Wordmark({ fontSize }: { fontSize: number }) {
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

function BrandCard() {
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
async function jpegDataUrl(url: string, width: number, height: number) {
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

async function png(element: React.ReactElement) {
  const response = new ImageResponse(element, { ...ogSize, fonts: [...ogFonts] });
  return Buffer.from(await response.arrayBuffer());
}

export function drawBrandCard() {
  return png(<BrandCard />);
}

// Game cards carry a photo, which is several times smaller as JPEG than as PNG.
async function jpeg(element: React.ReactElement) {
  return sharp(await png(element))
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export async function drawGameCard(game: OgGame) {
  const [hero, cover] = await Promise.all([
    game.hero_url ? jpegDataUrl(game.hero_url, ogSize.width, ogSize.height) : null,
    game.cover_url ? jpegDataUrl(game.cover_url, 300, 450) : null,
  ]);
  const titleSize = game.title.length > 28 ? 56 : game.title.length > 16 ? 68 : 84;
  const badges = badgeLabelsFor(game);

  return jpeg(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: brandColors.background,
        fontFamily: "Inter",
      }}
    >
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
        <img
          src={hero}
          alt=""
          width={ogSize.width}
          height={ogSize.height}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
      )}
      {/* Same exception as the site hero: a dark overlay so the text stays readable. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: ogSize.width,
          height: ogSize.height,
          display: "flex",
          backgroundImage:
            "linear-gradient(90deg, rgba(10,16,28,0.97) 0%, rgba(10,16,28,0.88) 55%, rgba(10,16,28,0.4) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 56,
          width: "100%",
          height: "100%",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            height: "100%",
          }}
        >
          <Wordmark fontSize={30} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {game.platform && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: game.platform.color,
                  }}
                />
                <div style={{ color: brandColors.muted }}>{game.platform.name}</div>
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                fontFamily: "Archivo",
                fontSize: titleSize,
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                color: brandColors.foreground,
              }}
            >
              {game.title}
            </div>
            <div style={{ marginTop: 20, fontSize: 32, color: brandColors.muted }}>
              {`A browser port of ${game.original_title}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, minHeight: 44 }}>
            {badges.map(({ key, label }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: `2px solid ${brandColors.border}`,
                  background: brandColors.surface,
                  color: brandColors.foreground,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
          <img
            src={cover}
            alt=""
            width={300}
            height={450}
            style={{ borderRadius: 18, border: `2px solid ${brandColors.border}` }}
          />
        )}
      </div>
    </div>,
  );
}
