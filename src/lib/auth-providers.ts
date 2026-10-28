export const oauthProviders = ["google", "discord"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

export const providerNames: Record<OAuthProvider, string> = {
  google: "Google",
  discord: "Discord",
};
