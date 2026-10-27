// Kept out of the "use client" nav module: a server component importing a value from a
// client module gets a client reference, not the array.
export const siteLinks = [
  { href: "/", label: "Discover" },
  { href: "/games", label: "All games" },
  { href: "/popular", label: "Popular" },
  { href: "/new", label: "New" },
];
