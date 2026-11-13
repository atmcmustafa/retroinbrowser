// Kept apart from the icons (components/site/game-badges.ts) so scripts can use the labels.
export const gameBadgeLabels = {
  mobile_support: "Works on mobile",
  gamepad_support: "Gamepad support",
  requires_own_files: "Needs your own game files",
} as const;

export type GameBadgeKey = keyof typeof gameBadgeLabels;

export function badgeLabelsFor(game: Record<GameBadgeKey, boolean>) {
  return (Object.keys(gameBadgeLabels) as GameBadgeKey[]).flatMap((key) =>
    game[key] ? [{ key, label: gameBadgeLabels[key] }] : [],
  );
}
