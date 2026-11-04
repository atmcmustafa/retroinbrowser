import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/site/json-ld";
import { LinkCheck } from "@/components/site/link-check";
import { ListingSkeleton } from "@/components/site/listing";
import { PageHeading } from "@/components/site/page-heading";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPortGroup, getPortGroups } from "@/lib/data/games";
import { env } from "@/lib/env";
import { baseOpenGraph } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const groups = await getPortGroups();
  // Cache Components rejects an empty list at build time; the placeholder resolves to notFound().
  return groups.length ? groups.map(({ slug }) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const group = await getPortGroup(slug);
  if (!group) return { title: "Game not found" };

  const title = `Play ${group.name} in your browser: ${group.ports.length} ports compared`;
  const description = `${group.ports.length} browser ports of ${group.name} side by side: which need your own game files, which work on a phone and which support a gamepad.`;
  return {
    title,
    description,
    alternates: { canonical: `/play/${group.slug}` },
    openGraph: { ...baseOpenGraph, title, description, url: `/play/${group.slug}` },
  };
}

export default function PlayPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ListingSkeleton />}>
        <Comparison params={params} />
      </Suspense>
    </div>
  );
}

async function Comparison({ params }: { params: Params }) {
  const { slug } = await params;
  const group = await getPortGroup(slug);
  if (!group) notFound();

  const { name, ports } = group;
  const absolute = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).href;
  // A line only helps when it tells the ports apart.
  const picks = [
    { label: "No files needed", games: ports.filter((port) => !port.requires_own_files) },
    { label: "On a phone", games: ports.filter((port) => port.mobile_support) },
    { label: "With a gamepad", games: ports.filter((port) => port.gamepad_support) },
  ].filter(({ games }) => games.length > 0 && games.length < ports.length);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "Games", item: absolute("/games") },
            { name, item: absolute(`/play/${group.slug}`) },
          ].map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Browser ports of ${name}`,
          numberOfItems: ports.length,
          itemListElement: ports.map((port, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: port.title,
            url: absolute(`/games/${port.slug}`),
          })),
        }}
      />

      <PageHeading
        title={`Play ${name} in your browser`}
        description={`${ports.length} ports of ${name} in the directory, side by side.`}
      />

      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Port</TableHead>
            <TableHead>Your files</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Gamepad</TableHead>
            <TableHead className="hidden sm:table-cell">Built with</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell className="max-w-40 whitespace-normal sm:max-w-none">
                <Link
                  href={`/games/${port.slug}`}
                  className="rounded-sm font-medium underline-offset-2 hover:underline"
                >
                  {port.title}
                </Link>
              </TableCell>
              <Flag value={port.requires_own_files} />
              <Flag value={port.mobile_support} />
              <Flag value={port.gamepad_support} />
              <TableCell className="hidden whitespace-normal text-muted-foreground sm:table-cell">
                {port.tech}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {picks.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]">
            Which one to pick
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {picks.map(({ label, games }) => (
              <li key={label}>
                <span className="text-muted-foreground">{label}: </span>
                {games.map((port, index) => (
                  <span key={port.id}>
                    {index > 0 && ", "}
                    <Link
                      href={`/games/${port.slug}`}
                      className="rounded-sm underline underline-offset-2"
                    >
                      {port.title}
                    </Link>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]">
          The ports
        </h2>
        <ul className="mt-6 flex flex-col gap-4">
          {ports.map((port) => (
            <li key={port.id} className="flex gap-4 rounded-card border bg-surface p-4 sm:gap-6">
              <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg border sm:w-28">
                {port.cover_url && (
                  <Image
                    src={port.cover_url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 112px, 80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">
                  <Link
                    href={`/games/${port.slug}`}
                    className="rounded-sm underline-offset-2 hover:underline"
                  >
                    {port.title}
                  </Link>
                </h3>
                {port.developer && (
                  <p className="mt-0.5 text-xs text-muted-foreground">By {port.developer}</p>
                )}
                {port.summary && <p className="mt-2 text-sm leading-relaxed">{port.summary}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  <LinkCheck status={port.link_status} checkedAt={port.last_checked_at} />
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <a href={`/go/${port.slug}`} target="_blank" rel="nofollow noopener">
                      Play
                      <ExternalLinkIcon data-icon="inline-end" />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/games/${port.slug}`}>Details</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Flag({ value }: { value: boolean }) {
  return (
    <TableCell className={value ? undefined : "text-muted-foreground"}>
      {value ? "Yes" : "No"}
    </TableCell>
  );
}
