import type { Metadata } from "next";
import { InfoBox } from "@/components/site/info-box";
import { PageHeading } from "@/components/site/page-heading";
import { TextSection } from "@/components/site/text-section";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "DMCA and takedowns",
  description: "How rights holders can ask us to remove a listing.",
  alternates: { canonical: "/dmca" },
};

const noticeItems = [
  "Your name, organization and contact details.",
  "The work you hold the rights to.",
  "The RetroInBrowser page or pages, for example retroinbrowser.com/games/…",
  "A statement that you believe in good faith the use isn't authorized by the rights holder, its agent or the law.",
  "A statement that the notice is accurate and that you are the rights holder or authorized to act for them.",
  "Your physical or electronic signature.",
];

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeading
        title="DMCA and takedowns"
        description="How rights holders can ask us to remove a listing."
      />
      <div className="mt-12 flex max-w-2xl flex-col gap-10">
        <InfoBox label="No game files here">
          RetroInBrowser doesn&apos;t host or distribute game files. Each listing is a link to a
          site run by someone else.
        </InfoBox>

        <TextSection title="Removing a listing">
          <p>
            If you hold the rights to a game and a listed port infringes them, email us and
            we&apos;ll remove the listing. The port itself lives on its own host, so contact them as
            well to take it down there.
          </p>
        </TextSection>

        <TextSection title="What to include">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
            {noticeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </TextSection>

        <TextSection title="Where to send it">
          <p>
            Email <a href={`mailto:${contactEmail}?subject=DMCA`}>{contactEmail}</a> with
            &ldquo;DMCA&rdquo; in the subject line.
          </p>
        </TextSection>

        <TextSection title="If we removed your port by mistake">
          <p>
            Email us with the page and why the listing doesn&apos;t infringe. We&apos;ll review it
            again.
          </p>
        </TextSection>
      </div>
    </div>
  );
}
