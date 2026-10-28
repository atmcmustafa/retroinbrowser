export const contactEmail = "retroinbrowser@gmail.com";

export const siteName = "RetroInBrowser";
export const siteDescription =
  "A curated directory of classic PC and console games ported to run in your browser, with notes on touch, gamepad and game-file support.";

// A page that sets openGraph replaces the root object instead of merging, so spread this in.
export const baseOpenGraph = { siteName, locale: "en_US", type: "website" } as const;
