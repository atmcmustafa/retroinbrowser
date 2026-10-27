import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "RetroInBrowser — Classic games ported to the web",
    template: "%s · RetroInBrowser",
  },
  description: "A curated directory of classic games ported to run in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${archivo.variable}`}>
      <body>
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
