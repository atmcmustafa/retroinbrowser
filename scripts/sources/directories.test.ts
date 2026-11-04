import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIndex, parseListing, pickPortLink } from "./directories";

test("parseIndex keeps browser ports and leaves out fan games and other kinds", () => {
  const text = [
    "# Directory",
    "- [Lugaru-Web](https://dir.example/lugaru/): Browser (source port), Lugaru (Windows). Playable.",
    "- [Arena of Champions](https://dir.example/arena/): Browser (fan game), World of Warcraft (PC).",
    "- [Some PC Port](https://dir.example/pc/): PC port, A Game (PlayStation). Needs files.",
    "- [Lugaru-Web](https://dir.example/lugaru/): Browser (source port), Lugaru (Windows). Repeated.",
    "- [Plain](https://dir.example/plain/): Browser, Crash Bash (PlayStation).",
  ].join("\n");
  assert.deepEqual(parseIndex(text), [
    { name: "Lugaru-Web", page: "https://dir.example/lugaru/" },
    { name: "Plain", page: "https://dir.example/plain/" },
  ]);
});

test("pickPortLink prefers the labelled live page", () => {
  const html = `
    <a href="https://store.steampowered.com/app/1/">Image credit</a>
    <a href="https://github.com/a/b">GitHub repository</a>
    <a href="https://port.example/play/">Lugaru (live page, created 2026)</a>
    <a href="https://dir.example/other/">Internal</a>`;
  assert.equal(pickPortLink(html, "https://dir.example/lugaru/"), "https://port.example/play/");
});

test("pickPortLink takes the play button first, then the website button", () => {
  const playButtons = `
    <a href="https://www.igdb.com/games/x">Artwork, via IGDB</a>
    <a href="https://play.port.example/">▶ Play The Game (Web Edition) ↗</a>
    <a href="https://port.example">Play ↗</a>
    <a href="https://github.com/a/b">GitHub ↗</a>`;
  assert.equal(pickPortLink(playButtons, "https://dir.example/x/"), "https://play.port.example/");
  const websiteButton = `
    <a href="https://original.example/media.html">Screenshot © The Project</a>
    <a href="https://port.example/">Website ↗</a>
    <a href="https://github.com/a/b">GitHub ↗</a>
    <a href="https://original.example/download.html">original.example (official site)</a>`;
  assert.equal(pickPortLink(websiteButton, "https://dir.example/x/"), "https://port.example/");
});

test("pickPortLink ignores image credits", () => {
  const onlyCredit = `<a href="https://art.example/">Key art © Someone</a>`;
  assert.equal(pickPortLink(onlyCredit, "https://dir.example/x/"), null);
});

test("pickPortLink falls back to a non-repo link, then the repo, and skips articles", () => {
  const articleThenSite = `
    <a href="https://kotaku.com/story">Kotaku</a>
    <a href="https://github.com/a/b">Repo</a>
    <a href="https://port.example/">Site</a>`;
  assert.equal(pickPortLink(articleThenSite, "https://dir.example/x/"), "https://port.example/");
  const onlyRepo = `<a href="https://github.com/a/b">Repo</a>`;
  assert.equal(pickPortLink(onlyRepo, "https://dir.example/x/"), "https://github.com/a/b");
  assert.equal(
    pickPortLink(`<a href="https://kotaku.com/s">K</a>`, "https://dir.example/x/"),
    null,
  );
});

test("parseListing reads the game name, its directory page and the play link", () => {
  const html = `<ul>
    <li class="row" data-kind="browser"><span class="c-game"><a href="/doom/">Doom &amp; Co</a><small>x</small></span>
      <span class="c-play"><a class="play solid" href="https://doom.example/?a=1&amp;b=2" target="_blank">PLAY</a></span></li>
    <li class="row" data-kind="pc"><span class="c-game"><a href="/pc-only/">PC Only</a></span></li>
  </ul>`;
  assert.deepEqual(parseListing(html, "https://dir.example/"), [
    { name: "Doom & Co", url: "https://doom.example/?a=1&b=2", page: "https://dir.example/doom/" },
  ]);
});
