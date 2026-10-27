import { FolderOpenIcon, Gamepad2Icon, SmartphoneIcon } from "lucide-react";

export const gameBadges = [
  { key: "mobile_support", label: "Works on mobile", Icon: SmartphoneIcon },
  { key: "gamepad_support", label: "Gamepad support", Icon: Gamepad2Icon },
  { key: "requires_own_files", label: "Needs your own game files", Icon: FolderOpenIcon },
] as const;

type BadgeFlags = { [K in (typeof gameBadges)[number]["key"]]: boolean };

export function badgesFor(game: BadgeFlags) {
  return gameBadges.filter(({ key }) => game[key]);
}
