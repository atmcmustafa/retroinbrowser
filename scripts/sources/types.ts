import type { Enums } from "@/types/database";

// One sighting of a possible port. url is what may become a candidate (the port, a repo or an
// article about it); sourceRef is where it was seen and keys the mention.
export type Mention = {
  url: string;
  title: string;
  source: Exclude<Enums<"candidate_source">, "user">;
  sourceRef: string;
  points?: number;
  seenAt: string;
};

export type Source = (since: Date) => Promise<Mention[]>;

// Titles worth a candidate: a port-like word, or "play/game" next to "browser/web". Everything
// else from these broad searches is noise that would only cost an extraction.
const portish =
  /\b(port(ed|s|ing)?|recomp\w*|decomp\w*|re-?implement\w*|remake|source port|wasm|webassembly|emscripten|webgpu)\b/i;
const playable = /\b(play(able|ing)?|games?)\b/i;
const inBrowser = /\b(browsers?|web)\b/i;

export function looksLikePort(title: string) {
  return portish.test(title) || (playable.test(title) && inBrowser.test(title));
}
