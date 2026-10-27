import {
  BombIcon,
  BrainIcon,
  CarIcon,
  CastleIcon,
  CompassIcon,
  CrosshairIcon,
  DicesIcon,
  FlagIcon,
  FootprintsIcon,
  Gamepad2Icon,
  GhostIcon,
  HandFistIcon,
  JoystickIcon,
  MapIcon,
  MountainIcon,
  MusicIcon,
  PlaneIcon,
  PuzzleIcon,
  RocketIcon,
  ShieldIcon,
  SkullIcon,
  SpadeIcon,
  SwordsIcon,
  TargetIcon,
  TrophyIcon,
  VolleyballIcon,
  WandSparklesIcon,
  ZapIcon,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

// genres.icon stores one of these names. A fixed map keeps icons tree-shaken and server-renderable.
export const genreIcons = {
  swords: SwordsIcon,
  compass: CompassIcon,
  flag: FlagIcon,
  crosshair: CrosshairIcon,
  footprints: FootprintsIcon,
  shield: ShieldIcon,
  "hand-fist": HandFistIcon,
  volleyball: VolleyballIcon,
  castle: CastleIcon,
  puzzle: PuzzleIcon,
  car: CarIcon,
  rocket: RocketIcon,
  ghost: GhostIcon,
  skull: SkullIcon,
  target: TargetIcon,
  trophy: TrophyIcon,
  brain: BrainIcon,
  music: MusicIcon,
  joystick: JoystickIcon,
  map: MapIcon,
  zap: ZapIcon,
  dices: DicesIcon,
  mountain: MountainIcon,
  plane: PlaneIcon,
  "wand-sparkles": WandSparklesIcon,
  bomb: BombIcon,
  spade: SpadeIcon,
  "gamepad-2": Gamepad2Icon,
} satisfies Record<string, LucideIcon>;

export type GenreIconName = keyof typeof genreIcons;

export const genreIconNames = Object.keys(genreIcons) as GenreIconName[];

export function genreIcon(name: string | null): LucideIcon {
  return name && name in genreIcons ? genreIcons[name as GenreIconName] : Gamepad2Icon;
}

// Use this in JSX: picking a component inside render trips react-hooks/static-components.
export function GenreIcon({ icon, ...props }: { icon: string | null } & LucideProps) {
  return createElement(genreIcon(icon), props);
}
