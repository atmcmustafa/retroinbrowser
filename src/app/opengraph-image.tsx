import { ImageResponse } from "next/og";
import { BrandCard, ogFonts, ogSize } from "@/lib/og";

export const alt = "RetroInBrowser: classic games, in your browser";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<BrandCard />, { ...ogSize, fonts: [...ogFonts] });
}
