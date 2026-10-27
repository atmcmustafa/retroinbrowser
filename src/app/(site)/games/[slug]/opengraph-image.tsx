import { ImageResponse } from "next/og";
import { badgesFor } from "@/components/site/game-badges";
import { brandColors } from "@/lib/brand";
import { getGameBySlug } from "@/lib/data/games";
import { BrandCard, jpegDataUrl, ogFonts, ogSize, Wordmark } from "@/lib/og";

export const alt = "Game artwork with the port name and original game";
export const size = ogSize;
export const contentType = "image/png";

// Rendered per request (unlisted slugs can't be prerendered); let the CDN keep it for a day.
const cdnCache = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game)
    return new ImageResponse(<BrandCard />, { ...ogSize, fonts: [...ogFonts], headers: cdnCache });

  const [hero, cover] = await Promise.all([
    game.hero_url ? jpegDataUrl(game.hero_url, ogSize.width, ogSize.height) : null,
    game.cover_url ? jpegDataUrl(game.cover_url, 300, 450) : null,
  ]);
  const titleSize = game.title.length > 28 ? 56 : game.title.length > 16 ? 68 : 84;
  const badges = badgesFor(game);

  return new ImageResponse(
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
    { ...ogSize, fonts: [...ogFonts], headers: cdnCache },
  );
}
