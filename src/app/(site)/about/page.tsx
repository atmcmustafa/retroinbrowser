import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/site/page-heading";
import { TextSection } from "@/components/site/text-section";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "A curated directory of classic games that run in your browser.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeading
        title="About"
        description="A curated directory of classic games that run in your browser."
      />
      <div className="mt-12 flex max-w-2xl flex-col gap-10">
        <TextSection title="What this is">
          <p>
            RetroInBrowser collects browser ports, remakes and recompilations of classic games in
            one place. Every listing links to the port&apos;s own site.
          </p>
          <p>
            We don&apos;t host game files or embed games here. The people who built each port
            deserve the visit.
          </p>
        </TextSection>

        <TextSection title="How games get in">
          <p>
            Anyone can <Link href="/submit">suggest a port</Link>. We also follow communities and
            news where new ports show up, and we check every link by hand before it goes up.
          </p>
          <p>
            The <Link href="/popular">Popular</Link> ranking counts clicks on Play. Nothing on the
            site is sponsored.
          </p>
        </TextSection>

        <TextSection title="Credits">
          <p>
            Cover art and hero images come from{" "}
            <a href="https://www.steamgriddb.com" rel="noopener">
              SteamGridDB
            </a>{" "}
            and its community artists. Each port belongs to its developers; we link their source
            code when it&apos;s public.
          </p>
          <p>RetroInBrowser isn&apos;t affiliated with any game publisher or platform holder.</p>
        </TextSection>

        <TextSection title="Contact">
          <p>
            Questions, corrections or a broken link:{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Rights holders can find takedown
            details on the <Link href="/dmca">DMCA page</Link>.
          </p>
        </TextSection>
      </div>
    </div>
  );
}
