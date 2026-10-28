import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreMentions } from "./score";

test("a candidate without mentions scores zero", () => {
  assert.equal(scoreMentions([]), 0);
});

test("each Hacker News story adds three, points add on a log scale", () => {
  const score = scoreMentions([
    { source: "hackernews", title: "Show HN: Doom in WebAssembly", points: 99 },
    { source: "hackernews", title: "Doom runs in the browser", points: 0 },
  ]);
  assert.equal(score, 6 + Math.log10(100));
});

test("news counts each publisher once", () => {
  const score = scoreMentions([
    { source: "googlenews", title: "You can play it in a browser now - Kotaku", points: null },
    { source: "googlenews", title: "Follow-up: the port got faster - Kotaku", points: null },
    { source: "googlenews", title: "The port nobody expected - The Verge", points: null },
  ]);
  assert.equal(score, 4);
});

test("GitHub stars come from the biggest repo, not the sum", () => {
  const score = scoreMentions([
    { source: "github", title: "a/port", points: 99 },
    { source: "github", title: "b/fork-of-port", points: 50 },
  ]);
  assert.equal(score, Math.log10(100));
});

test("negative or missing points don't lower the score", () => {
  assert.equal(scoreMentions([{ source: "reddit", title: "x", points: -5 }]), 0);
  assert.equal(scoreMentions([{ source: "reddit", title: "x", points: null }]), 0);
});
