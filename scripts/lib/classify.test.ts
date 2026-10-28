import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, fingerprint, type CheckResult } from "./classify";

const known: Parameters<typeof classify>[0] = {
  playUrl: "https://isle.pizza/",
  pageTitle: "LEGO Island in your browser",
};

function result(overrides: Partial<CheckResult>): CheckResult {
  return {
    status: 200,
    finalUrl: "https://isle.pizza/",
    ms: 900,
    title: "LEGO Island in your browser",
    h1: null,
    challenge: false,
    error: null,
    ...overrides,
  };
}

const verdict = (overrides: Partial<CheckResult>, base = known) =>
  classify(base, result(overrides)).verdict;

test("a normal answer is ok", () => {
  assert.equal(verdict({}), "ok");
});

test("a slow answer is slow, not broken", () => {
  assert.equal(verdict({ ms: 9_500 }), "slow");
});

test("HTTP errors and network errors are failures", () => {
  assert.equal(verdict({ status: 404 }), "fail");
  assert.equal(verdict({ status: 503 }), "fail");
  assert.equal(verdict({ status: null, error: "fetch failed" }), "fail");
});

test("451 and takedown notices in the title or heading are takedowns", () => {
  assert.equal(verdict({ status: 451 }), "taken_down");
  assert.equal(verdict({ title: "Removed: DMCA takedown" }), "taken_down");
  assert.equal(verdict({ h1: "This content is unavailable for legal reasons" }), "taken_down");
});

test("a DMCA link elsewhere on the page doesn't count", () => {
  assert.equal(verdict({ h1: "LEGO Island" }), "ok");
});

test("bot challenges say nothing either way", () => {
  assert.equal(verdict({ status: 403, title: "Just a moment...", challenge: true }), "unknown");
});

test("moving to another site or a parked page is a change", () => {
  assert.equal(verdict({ finalUrl: "https://casino.example/" }), "changed");
  assert.equal(verdict({ title: "isle.pizza is for sale", h1: "Buy this domain" }), "changed");
});

test("moving within the same domain is not a change", () => {
  assert.equal(
    verdict(
      { finalUrl: "https://app.example.com/play" },
      { playUrl: "https://www.example.com/", pageTitle: null },
    ),
    "ok",
  );
});

test("a title with nothing in common with the old one is a change", () => {
  assert.equal(verdict({ title: "Welcome to nginx!" }), "changed");
  assert.equal(verdict({ title: "LEGO Island v2.1" }), "ok");
});

test("no stored title means the first title is accepted", () => {
  assert.equal(verdict({ title: "Anything" }, { ...known, pageTitle: null }), "ok");
});

test("fingerprints ignore case and spacing", () => {
  assert.equal(fingerprint("Title", "Some   Text"), fingerprint("title", "some text"));
});
