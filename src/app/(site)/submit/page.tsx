import type { Metadata } from "next";
import { InfoBox } from "@/components/site/info-box";
import { PageHeading } from "@/components/site/page-heading";
import { SubmitForm } from "@/components/site/submit-form";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Submit a game",
  description: "Suggest a classic game that runs in the browser.",
  alternates: { canonical: "/submit" },
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeading
        title="Submit a game"
        description="Found a classic game that runs in the browser? Send us the link."
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SubmitForm siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        <aside className="flex flex-col gap-4">
          <InfoBox label="What we list">
            Ports, remakes and recompilations of classic games that run in a browser tab. We check
            every link by hand before it goes up.
          </InfoBox>
          <InfoBox label="No ROM sites">
            We list ports that run in a browser tab, not ROM or download sites. Ports that ask for
            your own copy are fine.
          </InfoBox>
        </aside>
      </div>
    </div>
  );
}
