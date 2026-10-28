import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeUrl, urlKey } from "@/lib/normalize-url";

test("drops www, trailing slashes, tracking parameters and the hash", () => {
  assert.equal(
    normalizeUrl("https://www.Example.com/play/?utm_source=hn&ref=x&level=2#start"),
    "https://example.com/play?level=2",
  );
});

test("keeps the scheme but the key ignores it", () => {
  const http = normalizeUrl("http://example.com/game");
  const https = normalizeUrl("https://example.com/game/");
  assert.equal(http, "http://example.com/game");
  assert.ok(http && https);
  assert.equal(urlKey(http), urlKey(https));
});

test("rejects anything that isn't http(s)", () => {
  assert.equal(normalizeUrl("javascript:alert(1)"), null);
  assert.equal(normalizeUrl("ftp://example.com/file"), null);
  assert.equal(normalizeUrl("not a url"), null);
});
