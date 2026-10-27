"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { savePlatform } from "@/lib/actions/taxonomy";
import type { AdminPlatform } from "@/lib/data/admin";
import { platformSchema, type PlatformInput } from "@/lib/schemas/taxonomy";
import { slugify } from "@/lib/slug";

const hexColor = /^#[0-9a-f]{6}$/i;

function defaultsFor(platform?: AdminPlatform): PlatformInput {
  return {
    name: platform?.name ?? "",
    slug: platform?.slug ?? "",
    short_name: platform?.short_name ?? "",
    color: platform?.color ?? "#94a3b8",
  };
}

export function PlatformDialog({ platform }: { platform?: AdminPlatform }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(platform));
  const [pending, startTransition] = useTransition();
  const form = useForm<PlatformInput>({
    resolver: zodResolver(platformSchema),
    defaultValues: defaultsFor(platform),
  });
  const { control } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    form.reset(defaultsFor(platform));
    setSlugEdited(Boolean(platform));
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await savePlatform(platform?.id ?? null, values);
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof PlatformInput, { message });
        }
        toast.error(result.message);
        return;
      }
      toast.success(platform ? "Platform saved." : "Platform added.");
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {platform ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${platform.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add platform
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{platform ? `Edit ${platform.name}` : "Add platform"}</DialogTitle>
          <DialogDescription>The system a game originally came out on.</DialogDescription>
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
                    retroinbrowser.com/platforms/{field.value || "…"}
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="short_name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-short`}>Short name</FieldLabel>
                    <Input
                      id={`${id}-short`}
                      {...field}
                      placeholder="N64"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="color"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-color`}>Color</FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        aria-label="Pick a color"
                        value={hexColor.test(field.value) ? field.value : "#000000"}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-8 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                      />
                      <Input id={`${id}-color`} {...field} aria-invalid={fieldState.invalid} />
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
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
