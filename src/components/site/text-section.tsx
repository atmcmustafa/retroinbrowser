export function TextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
