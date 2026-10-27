// Writes the favicon set from the logo mark in src/lib/brand.ts.
// Usage: npx tsx scripts/generate-icons.ts (outputs are committed; rerun after a logo change)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { brandColors, gamepadLines, gamepadPath } from "@/lib/brand";

const appDir = join(process.cwd(), "src/app");

const mark = [
  ...gamepadLines.map(
    ({ x1, x2, y1, y2 }) => `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"/>`,
  ),
  `<path d="${gamepadPath}"/>`,
].join("");

// rounded: browser tabs show the shape; Apple applies its own mask, so it gets a full square.
function iconSvg({ rounded }: { rounded: boolean }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32"${rounded ? ' rx="7"' : ""} fill="${brandColors.background}"/><g transform="translate(4 4)" fill="none" stroke="${brandColors.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${mark}</g></svg>`;
}

function png(svg: string, size: number) {
  return sharp(Buffer.from(svg), { density: (72 * size) / 32 })
    .resize(size, size)
    .png()
    .toBuffer();
}

// ICO container holding PNG images, which every current browser accepts.
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

async function main() {
  const tabIcon = iconSvg({ rounded: true });
  writeFileSync(join(appDir, "icon.svg"), tabIcon);

  const sizes = [16, 32, 48];
  const images = await Promise.all(
    sizes.map(async (size) => ({ size, data: await png(tabIcon, size) })),
  );
  writeFileSync(join(appDir, "favicon.ico"), ico(images));

  writeFileSync(join(appDir, "apple-icon.png"), await png(iconSvg({ rounded: false }), 180));
  console.log("Wrote src/app/icon.svg, favicon.ico, apple-icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
