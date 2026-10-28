"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch, type Control, type DefaultValues } from "react-hook-form";
import { toast } from "sonner";
import { ArtworkPicker } from "@/components/admin/artwork-picker";
import { DeleteGameButton } from "@/components/admin/delete-game-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveGame } from "@/lib/actions/games";
import type { AdminGame } from "@/lib/data/admin";
import type { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import type { Artwork, ArtworkKind } from "@/lib/images";
import type { Extracted } from "@/lib/schemas/extraction";
import { gameSchema, gameStatusLabels, type GameInput } from "@/lib/schemas/game";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { Constants } from "@/types/database";

type Candidate = { id: string; url: string; title: string | null; extracted: Extracted | null };

type Platforms = Awaited<ReturnType<typeof getPlatforms>>;
type Genres = Awaited<ReturnType<typeof getGenres>>;

type Props = {
  game?: AdminGame;
  // Prefills a new game from a submission or a discovered port; saving approves the candidate.
  candidate?: Candidate;
  platforms: Platforms;
  genres: Genres;
};

const artworkField = { cover: "cover_url", hero: "hero_url" } as const;

// "Diablo Web" already names the game; "OpenLara" doesn't, so its slug leads with "tomb-raider".
function candidateSlug(title: string, original: string | null) {
  const named = !original || title.toLowerCase().includes(original.toLowerCase());
  return slugify(named ? title : `${original} ${title}`).slice(0, 80);
}

function defaultsFor(
  game: AdminGame | undefined,
  candidate: Candidate | undefined,
  platforms: Platforms,
  genres: Genres,
): DefaultValues<GameInput> {
  const found = candidate?.extracted?.is_port ? candidate.extracted : null;
  return {
    title: game?.title ?? found?.title ?? "",
    slug: game?.slug ?? (found?.title ? candidateSlug(found.title, found.original_title) : ""),
    original_title: game?.original_title ?? found?.original_title ?? candidate?.title ?? "",
    platform_id:
      game?.platform_id ?? platforms.find(({ slug }) => slug === found?.platform_slug)?.id,
    genre_ids:
      game?.game_genres.map(({ genre_id }) => genre_id) ??
      genres.filter(({ slug }) => found?.genre_slugs.includes(slug)).map(({ id }) => id),
    play_url: game?.play_url ?? found?.play_url ?? candidate?.url ?? "",
    source_url: game?.source_url ?? found?.source_url ?? "",
    developer: game?.developer ?? found?.developer ?? "",
    summary: game?.summary ?? found?.summary?.slice(0, 280) ?? "",
    description: game?.description ?? found?.description?.slice(0, 8000) ?? "",
    tech: game?.tech ?? found?.tech?.slice(0, 60) ?? "",
    cover_url: game?.cover_url ?? found?.artwork?.cover_url ?? "",
    hero_url: game?.hero_url ?? found?.artwork?.hero_url ?? "",
    steamgriddb_id: game?.steamgriddb_id ?? found?.artwork?.steamgriddb_id ?? null,
    requires_own_files: game?.requires_own_files ?? found?.requires_own_files ?? false,
    mobile_support: game?.mobile_support ?? found?.mobile_support ?? false,
    gamepad_support: game?.gamepad_support ?? found?.gamepad_support ?? false,
    featured: game?.featured ?? false,
    status: game?.status ?? (found ? "published" : "draft"),
  };
}

export function GameForm({ game, candidate, platforms, genres }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(Boolean(game));
  // Picked SteamGridDB images (and ones the extractor found); the full image is imported on save.
  const [previews, setPreviews] = useState<Partial<Record<ArtworkKind, string>>>(() => {
    const artwork = candidate?.extracted?.is_port ? candidate.extracted.artwork : null;
    return {
      cover: artwork?.cover_url ?? undefined,
      hero: artwork?.hero_url ?? undefined,
    };
  });

  const form = useForm<GameInput>({
    resolver: zodResolver(gameSchema),
    defaultValues: defaultsFor(game, candidate, platforms, genres),
  });
  const { control } = form;
  const [slug, originalTitle, steamGridId, coverUrl, heroUrl] = useWatch({
    control,
    name: ["slug", "original_title", "steamgriddb_id", "cover_url", "hero_url"],
  });

  function pickArtwork(kind: ArtworkKind, artwork: Artwork, gameId: number) {
    form.setValue(artworkField[kind], artwork.url, { shouldDirty: true });
    form.setValue("steamgriddb_id", gameId, { shouldDirty: true });
    setPreviews((current) => ({ ...current, [kind]: artwork.thumb }));
  }

  function clearArtwork(kind: ArtworkKind) {
    form.setValue(artworkField[kind], "", { shouldDirty: true });
    setPreviews((current) => ({ ...current, [kind]: undefined }));
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveGame(game?.id ?? null, values, candidate?.id ?? null);
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof GameInput, { message });
        }
        toast.error(result.message);
        return;
      }
      form.reset({ ...values, cover_url: result.cover_url, hero_url: result.hero_url });
      setPreviews({});
      toast.success(game ? "Changes saved." : "Game created.");
      if (!game) router.replace(`/admin/games/${result.id}`);
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-w-0 flex-col gap-10">
        <FieldSet>
          <FieldLegend>Port</FieldLegend>
          <FieldGroup>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">Port name</FieldLabel>
                  <Input
                    id="title"
                    {...field}
                    aria-invalid={fieldState.invalid}
                    onChange={(event) => {
                      field.onChange(event);
                      if (!slugEdited) {
                        form.setValue("slug", slugify(event.target.value), {
                          shouldValidate: form.formState.isSubmitted,
                        });
                      }
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <TextField
              control={control}
              name="slug"
              label="Slug"
              description={`retroinbrowser.com/games/${slug || "…"}`}
              onInput={() => setSlugEdited(true)}
            />
            <TextField
              control={control}
              name="play_url"
              label="Play URL"
              type="url"
              placeholder="https://"
              description="Where the Play button sends people."
            />
            <TextField
              control={control}
              name="source_url"
              label="Source URL"
              type="url"
              placeholder="https://github.com/…"
              description="Repository or project page. Optional."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField control={control} name="developer" label="Developer" />
              <TextField
                control={control}
                name="tech"
                label="Tech"
                placeholder="WebAssembly, JavaScript…"
              />
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Original game</FieldLegend>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField control={control} name="original_title" label="Title" />
              <Controller
                name="platform_id"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="platform_id">Platform</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger
                        id="platform_id"
                        ref={field.ref}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={String(platform.id)}>
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ backgroundColor: platform.color }}
                            />
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            <Controller
              name="genre_ids"
              control={control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant="label">Genres</FieldLegend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {genres.map((genre) => (
                      <Field key={genre.id} orientation="horizontal">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={field.value.includes(genre.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, genre.id]
                                : field.value.filter((id) => id !== genre.id),
                            )
                          }
                        />
                        <FieldLabel htmlFor={`genre-${genre.id}`} className="font-normal">
                          {genre.name}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
            <Controller
              name="summary"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="summary">Summary</FieldLabel>
                  <Textarea id="summary" rows={3} {...field} aria-invalid={fieldState.invalid} />
                  <FieldDescription>
                    One or two sentences. {field.value.length}/280
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Game page</FieldLegend>
          <FieldGroup>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    rows={16}
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="font-mono text-sm"
                  />
                  <FieldDescription>
                    A blank line starts a paragraph. ## Heading, - list item, **bold**, `file.ext`,
                    [text](https://…). {field.value.length}/8000
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </div>

      <div className="flex flex-col gap-10">
        <FieldSet>
          <FieldLegend>Publishing</FieldLegend>
          <FieldGroup>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="status"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.game_status.map((status) => (
                        <SelectItem key={status} value={status}>
                          {gameStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Only published games appear on the site.</FieldDescription>
                </Field>
              )}
            />
            <SwitchField
              control={control}
              name="featured"
              label="Featured"
              description="Shown in the home page hero."
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Badges</FieldLegend>
          <FieldGroup className="gap-4">
            <SwitchField control={control} name="mobile_support" label="Works on mobile" />
            <SwitchField control={control} name="gamepad_support" label="Gamepad support" />
            <SwitchField
              control={control}
              name="requires_own_files"
              label="Needs your own game files"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Artwork</FieldLegend>
          <FieldGroup>
            {(["cover", "hero"] as const).map((kind) => {
              const value = kind === "cover" ? coverUrl : heroUrl;
              const src = previews[kind] ?? value;
              const error = form.formState.errors[artworkField[kind]];
              return (
                <Field key={kind} data-invalid={Boolean(error)}>
                  <FieldTitle>
                    {kind === "cover" ? "Cover · 600×900" : "Hero · 1920×620"}
                  </FieldTitle>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border bg-surface",
                      kind === "cover" ? "aspect-[2/3] w-36" : "aspect-[1920/620] w-full",
                    )}
                  >
                    {src ? (
                      <Image src={src} alt="" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon aria-hidden className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ArtworkPicker
                      kind={kind}
                      query={originalTitle}
                      steamGridId={steamGridId}
                      onPick={(artwork, gameId) => pickArtwork(kind, artwork, gameId)}
                    />
                    {src && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearArtwork(kind)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {previews[kind] && <FieldDescription>Imported when you save.</FieldDescription>}
                  <FieldError errors={[error]} />
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-background py-4 lg:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : game ? "Save changes" : "Create game"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/games">Cancel</Link>
        </Button>
        {game && (
          <div className="ml-auto">
            <DeleteGameButton id={game.id} title={game.title} />
          </div>
        )}
      </div>
    </form>
  );
}

type TextName = "slug" | "original_title" | "play_url" | "source_url" | "developer" | "tech";

function TextField({
  control,
  name,
  label,
  description,
  ...props
}: {
  control: Control<GameInput>;
  name: TextName;
  label: string;
  description?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Input>, "name">) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input id={name} {...props} {...field} aria-invalid={fieldState.invalid} />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

type SwitchName = "featured" | "mobile_support" | "gamepad_support" | "requires_own_files";

function SwitchField({
  control,
  name,
  label,
  description,
}: {
  control: Control<GameInput>;
  name: SwitchName;
  label: string;
  description?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </FieldContent>
          <Switch
            id={name}
            ref={field.ref}
            checked={field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
          />
        </Field>
      )}
    />
  );
}
