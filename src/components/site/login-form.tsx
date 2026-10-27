"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendMagicLink, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { status: "idle", email: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);
  const invalid = state.status === "invalid";

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "email-error" : undefined}
        />
        {invalid && <FieldError id="email-error">{state.message}</FieldError>}
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send sign-in link"}
      </Button>
      <div aria-live="polite" className="text-sm">
        {state.status === "sent" && (
          <p className="text-muted-foreground">
            Check <span className="text-foreground">{state.email}</span> for the link and open it in
            this browser.
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-destructive">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
