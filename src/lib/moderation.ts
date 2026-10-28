import {
  DataSet,
  englishDataset,
  englishRecommendedTransformers,
  parseRawPattern,
  RegExpMatcher,
} from "obscenity";

// English comes from the library. Turkish is written without its letters (input is folded the
// same way) and with doubled letters collapsed ("yarrak" -> "yarak"), because the matcher
// collapses them in the input too. Prefix-only patterns catch suffixed forms ("salaksın").
// Bare "sik" is left out: folded, it is also "sık" (often), as "sikici" is also "sıkıcı" (boring).
const words = (list: string) => list.trim().split(/\s+/);
const turkishPrefixes = words(`
  siktir sikerim sikeyim sikik orospu orosbu yarak amina amcik pezevenk kahpe serefsiz namussuz
  ibne gavat pust yavsak kaltak surtuk fahise kancik gotveren gotlek tasak boktan gerizekali
  dangalak embesil beyinsiz ahmak angut dallama denyo hoduk salak aptal
`);
const wholeWords = words("amk aq bok kys idiot idiots moron morons imbecile");

// The English list flags these by mistake: Turkish "cuma" (Friday), "cümle" (sentence),
// "cumhuriyet" and "analiz", and the cockpit of a flight game.
const allowed = words("cockpit cuma cumle cumhur analiz");

const dataset = new DataSet<{ originalWord?: string }>()
  .addAll(englishDataset)
  .addPhrase((phrase) => {
    for (const word of turkishPrefixes) phrase.addPattern(parseRawPattern(`|${word}`));
    for (const word of wholeWords) phrase.addPattern(parseRawPattern(`|${word}|`));
    phrase.addPattern(parseRawPattern("kill yourself"));
    for (const word of allowed) phrase.addWhitelistedTerm(word);
    return phrase;
  });

const matcher = new RegExpMatcher({ ...dataset.build(), ...englishRecommendedTransformers });

// "ı" is the one Turkish letter with no decomposition to strip down to ASCII.
function fold(text: string) {
  return text.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFKD").replace(/\p{M}/gu, "");
}

// Bare domains count too; the lookahead keeps "great.co-op" from reading as a .co address.
const link =
  /(https?:\/\/|www\.)|[a-z0-9-]\.(com|net|org|io|gg|xyz|ru|tk|ly|me|co|app|dev|site|online|top|info|biz|tv|link|club|shop|live)(?![\w-])/i;

export type CommentProblem = "link" | "profanity";

export function findCommentProblem(text: string): CommentProblem | null {
  if (link.test(text)) return "link";
  if (matcher.hasMatch(fold(text))) return "profanity";
  return null;
}
