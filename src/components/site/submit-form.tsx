"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitGame, type SubmitState } from "@/lib/actions/submit";

const initialState: SubmitState = { status: "idle" };

export function SubmitForm({ siteKey }: { siteKey: string | undefined }) {
  const [state, formAction, pending] = useActionState(submitGame, initialState);
  const turnstile = useRef<TurnstileInstance>(null);

  // Tokens are single-use, so every attempt needs a fresh one.
  useEffect(() => {
    if (state.status !== "idle") turnstile.current?.reset();
  }, [state]);

  if (!siteKey) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
        Submissions are closed for now.
      </p>
    );
  }

  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const values = "values" in state ? state.values : undefined;

  return (
    <form action={formAction} noValidate className="flex max-w-xl flex-col gap-6">
      <Status state={state} />

      <Field data-invalid={Boolean(errors.url)}>
        <FieldLabel htmlFor="url">Link to the port</FieldLabel>
        <Input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          placeholder="https://"
          required
          defaultValue={values?.url}
          aria-invalid={Boolean(errors.url) || undefined}
        />
        <FieldError>{errors.url}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="title">Game</FieldLabel>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Doom"
          defaultValue={values?.title}
          aria-invalid={Boolean(errors.title) || undefined}
        />
        <FieldDescription>Which classic game it ports. Optional.</FieldDescription>
        <FieldError>{errors.title}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.note)}>
        <FieldLabel htmlFor="note">Note</FieldLabel>
        <Textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={values?.note}
          aria-invalid={Boolean(errors.note) || undefined}
        />
        <FieldDescription>
          Anything we should know, like files it needs or controls. Optional.
        </FieldDescription>
        <FieldError>{errors.note}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.token)}>
        <Turnstile
          ref={turnstile}
          siteKey={siteKey}
          options={{ theme: "dark", size: "flexible", action: "submit" }}
        />
        <FieldError>{errors.token}</FieldError>
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send submission"}
      </Button>
    </form>
  );
}

function Status({ state }: { state: SubmitState }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {state.status === "done" && (
        <p className="flex items-start gap-2.5 rounded-lg border bg-surface p-4 text-sm">
          <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          {state.known
            ? "Thanks! Someone already sent this one; it's in the review queue."
            : "Thanks! We'll review it and add it if it runs in the browser."}
        </p>
      )}
      {state.status === "listed" && (
        <p className="rounded-lg border bg-surface p-4 text-sm">
          That port is already listed:{" "}
          <Link
            href={`/games/${state.game.slug}`}
            className="rounded-sm font-semibold underline underline-offset-2"
          >
            {state.game.title}
          </Link>
          .
        </p>
      )}
      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
