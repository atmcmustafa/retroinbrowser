import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { siteLinks } from "@/components/site/links";
import { contactEmail } from "@/lib/site";

const projectLinks = [
  { href: "/submit", label: "Submit a game" },
  { href: "/about", label: "About" },
  { href: "/dmca", label: "DMCA" },
  { href: `mailto:${contactEmail}`, label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A curated directory of classic games ported to run in your browser.
          </p>
        </div>
        <FooterLinks title="Browse" links={siteLinks} />
        <FooterLinks title="Project" links={projectLinks} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">No game files here.</span>{" "}
            RetroInBrowser links to each port&apos;s own site and hosts nothing.
          </p>
          <p>
            Cover art from{" "}
            <a
              href="https://www.steamgriddb.com"
              className="rounded-sm underline underline-offset-2 hover:text-foreground"
            >
              SteamGridDB
            </a>
            . Not affiliated with any game publisher or platform holder.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="rounded-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
