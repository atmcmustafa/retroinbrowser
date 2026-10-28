import { cn } from "@/lib/utils";

// Renders the small Markdown subset admins write in game descriptions: paragraphs, "## " headings,
// "- " and "1. " lists, **bold**, `code` and [links](https://...). Text goes through React, so
// nothing in the source can inject markup.

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const listItem = /^(?:[-*]|(\d+)[.)])\s+(.*)$/;

function parseBlocks(source: string) {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Extract<Block, { type: "list" }> | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (list) blocks.push(list);
    paragraph = [];
    list = null;
  };

  for (const line of source.split(/\r?\n/).map((raw) => raw.trim())) {
    if (!line) {
      flush();
      continue;
    }
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }
    const item = listItem.exec(line);
    if (item) {
      const ordered = item[1] !== undefined;
      if (paragraph.length || (list && list.ordered !== ordered)) flush();
      list ??= { type: "list", ordered, items: [] };
      list.items.push(item[2]);
      continue;
    }
    if (list) list.items[list.items.length - 1] += ` ${line}`;
    else paragraph.push(line);
  }
  flush();
  return blocks;
}

const inline = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/;

function renderInline(text: string) {
  return text.split(inline).map((part, index) => {
    if (index % 2 === 0) return part;
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) {
      return (
        <code key={index} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    const split = part.indexOf("](");
    return (
      <a
        key={index}
        href={part.slice(split + 2, -1)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm text-foreground underline underline-offset-2"
      >
        {part.slice(1, split)}
      </a>
    );
  });
}

export function RichText({ source }: { source: string }) {
  return (
    <div className="leading-relaxed">
      {parseBlocks(source).map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="mt-8 font-display text-xl font-extrabold tracking-tight [font-stretch:125%] first:mt-0"
            >
              {renderInline(block.text)}
            </h2>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index} className="mt-4 first:mt-0">
              {renderInline(block.text)}
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={cn(
              "mt-4 flex flex-col gap-2 pl-5 marker:text-muted-foreground first:mt-0",
              block.ordered ? "list-decimal" : "list-disc",
            )}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
