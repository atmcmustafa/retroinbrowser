import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
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

export const catalogSorts = ["popular", "new", "title"] as const;
export type CatalogSort = (typeof catalogSorts)[number];

export const pageParams = {
  page: parseAsInteger.withDefault(1),
};

export const loadPageParams = createLoader(pageParams);

export const catalogParams = {
  q: parseAsString.withDefault(""),
  genre: parseAsString,
  platform: parseAsString,
  mobile: parseAsBoolean.withDefault(false),
  gamepad: parseAsBoolean.withDefault(false),
  nofiles: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(catalogSorts).withDefault("popular"),
  ...pageParams,
};

export const loadCatalogParams = createLoader(catalogParams);
export const serializeCatalogParams = createSerializer(catalogParams);

export const adminCandidatesParams = {
  status: parseAsStringLiteral(Constants.public.Enums.candidate_status).withDefault("pending"),
};

export const loadAdminCandidatesParams = createLoader(adminCandidatesParams);
export const serializeAdminCandidatesParams = createSerializer(adminCandidatesParams);
