export function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-lg border bg-surface p-5">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{label}</p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </aside>
  );
}
