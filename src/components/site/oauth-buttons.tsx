"use client";

import { useFormStatus } from "react-dom";
import { providerIcons } from "@/components/site/provider-icons";
import { Button } from "@/components/ui/button";
import { signInWithProvider } from "@/lib/actions/auth";
import { providerNames, type OAuthProvider } from "@/lib/auth-providers";

export function OAuthButtons({ providers, next }: { providers: OAuthProvider[]; next: string }) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {providers.map((provider) => (
        <form key={provider} action={signInWithProvider}>
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="next" value={next} />
          <ProviderButton provider={provider} />
        </form>
      ))}
    </div>
  );
}

function ProviderButton({ provider }: { provider: OAuthProvider }) {
  const { pending } = useFormStatus();
  const Icon = providerIcons[provider];

  return (
    <Button type="submit" variant="outline" size="lg" disabled={pending} className="w-full">
      <Icon data-icon="inline-start" />
      {pending ? "Redirecting…" : `Continue with ${providerNames[provider]}`}
    </Button>
  );
}
