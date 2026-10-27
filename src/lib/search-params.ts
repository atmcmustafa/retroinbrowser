import {
  createLoader,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { Constants } from "@/types/database";

export const adminGameSorts = ["updated", "title", "clicks"] as const;

export const adminGamesParams = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(Constants.public.Enums.game_status),
  sort: parseAsStringLiteral(adminGameSorts).withDefault("updated"),
};

export type AdminGamesFilters = inferParserType<typeof adminGamesParams>;

export const loadAdminGamesParams = createLoader(adminGamesParams);
export const serializeAdminGamesParams = createSerializer(adminGamesParams);
