"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveGenre } from "@/lib/actions/taxonomy";
import type { AdminGenre } from "@/lib/data/admin";
import { GenreIcon, genreIconNames, genreIcons, type GenreIconName } from "@/lib/genre-icons";
import { genreSchema, type GenreInput } from "@/lib/schemas/taxonomy";
import { slugify } from "@/lib/slug";

function defaultsFor(genre?: AdminGenre): DefaultValues<GenreInput> {
  return {
    name: genre?.name ?? "",
    slug: genre?.slug ?? "",
    icon: genre?.icon && genre.icon in genreIcons ? (genre.icon as GenreIconName) : undefined,
  };
}

export function GenreDialog({ genre }: { genre?: AdminGenre }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(genre));
  const [pending, startTransition] = useTransition();
  const form = useForm<GenreInput>({
    resolver: zodResolver(genreSchema),
    defaultValues: defaultsFor(genre),
  });
  const { control } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    form.reset(defaultsFor(genre));
    setSlugEdited(Boolean(genre));
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveGenre(genre?.id ?? null, values);
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof GenreInput, { message });
        }
        toast.error(result.message);
        return;
      }
      toast.success(genre ? "Genre saved." : "Genre added.");
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {genre ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${genre.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add genre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{genre ? `Edit ${genre.name}` : "Add genre"}</DialogTitle>
          <DialogDescription>Genres group games on the home page and in filters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
                  <Input
                    id={`${id}-name`}
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
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-slug`}>Slug</FieldLabel>
                  <Input
                    id={`${id}-slug`}
                    {...field}
                    aria-invalid={fieldState.invalid}
                    onInput={() => setSlugEdited(true)}
                  />
                  <FieldDescription>
                    retroinbrowser.com/genres/{field.value || "…"}
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="icon"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-icon`}>Icon</FieldLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={`${id}-icon`}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="Choose an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {genreIconNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          <GenreIcon icon={name} aria-hidden />
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
