import { FolderOpenIcon, Gamepad2Icon, SmartphoneIcon } from "lucide-react";
import { gameBadgeLabels, type GameBadgeKey } from "@/lib/game-badge-labels";

export const gameBadges = [
  { key: "mobile_support", label: gameBadgeLabels.mobile_support, Icon: SmartphoneIcon },
  { key: "gamepad_support", label: gameBadgeLabels.gamepad_support, Icon: Gamepad2Icon },
  { key: "requires_own_files", label: gameBadgeLabels.requires_own_files, Icon: FolderOpenIcon },
] as const;

export function badgesFor(game: Record<GameBadgeKey, boolean>) {
  return gameBadges.filter(({ key }) => game[key]);
}
