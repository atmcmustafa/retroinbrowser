export function PageHeading({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance [font-stretch:125%] sm:text-[3.5rem]">
        {title}
      </h1>
      {description && <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>}
    </div>
  );
}
