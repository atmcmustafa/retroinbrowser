import assert from "node:assert/strict";
import { test } from "node:test";
import { filterCatalog, type CatalogFilter, type CatalogItem } from "./catalog-filter";

const game = (title: string, extra: Partial<CatalogItem> = {}): CatalogItem => ({
  title,
  original_title: title,
  developer: null,
  published_at: null,
  mobile_support: false,
  gamepad_support: false,
  requires_own_files: false,
  genre_ids: [],
  platform: null,
  ...extra,
});

const all: CatalogFilter = {
  q: "",
  genreId: null,
  platform: null,
  mobile: false,
  gamepad: false,
  noFiles: false,
  sort: "popular",
};

const items = [
  game("Quake", { developer: "id Software", genre_ids: [1], published_at: "2026-10-01" }),
  game("Doom", { original_title: "DOOM", mobile_support: true, published_at: "2026-11-01" }),
  game("Abuse", { requires_own_files: true, platform: { slug: "dos" } }),
];
const titles = (filter: Partial<CatalogFilter>) =>
  filterCatalog(items, { ...all, ...filter }).map(({ title }) => title);

test("keeps the given order for Popular", () => {
  assert.deepEqual(titles({}), ["Quake", "Doom", "Abuse"]);
});

test("matches title, original title and developer, ignoring case", () => {
  assert.deepEqual(titles({ q: "doom" }), ["Doom"]);
  assert.deepEqual(titles({ q: "ID soft" }), ["Quake"]);
});

test("drops characters the server search drops", () => {
  assert.deepEqual(titles({ q: "qua(" }), ["Quake"]);
});

test("filters by genre, platform and flags", () => {
  assert.deepEqual(titles({ genreId: 1 }), ["Quake"]);
  assert.deepEqual(titles({ platform: "dos" }), ["Abuse"]);
  assert.deepEqual(titles({ mobile: true }), ["Doom"]);
  assert.deepEqual(titles({ noFiles: true }), ["Quake", "Doom"]);
});

test("sorts by newest, then title, and by title", () => {
  assert.deepEqual(titles({ sort: "new" }), ["Doom", "Quake", "Abuse"]);
  assert.deepEqual(titles({ sort: "title" }), ["Abuse", "Doom", "Quake"]);
});
