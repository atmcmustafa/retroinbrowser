import { z } from "zod";

// Gemini API free tier (Google AI Studio key, no billing). Its terms let Google use the content
// to improve its products; we only send public web pages.
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 120_000;

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number | null = null,
  ) {
    super(message);
  }
}

type ErrorBody = {
  error?: { message?: string; details?: { retryDelay?: string }[] };
};

function retryDelay(body: ErrorBody) {
  const delay = body.error?.details?.find(({ retryDelay }) => retryDelay)?.retryDelay;
  const seconds = delay ? Number.parseFloat(delay) : NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function request(apiKey: string, model: string, body: object) {
  const res = await fetch(`${API}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    // A hung request is what an overloaded model usually looks like.
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new GeminiError(`${model} timed out`, 504);
    }
    throw error;
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = json as ErrorBody;
    throw new GeminiError(
      error.error?.message ?? `Gemini answered ${res.status}`,
      res.status,
      retryDelay(error),
    );
  }

  const candidate = json.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part: { thought?: boolean; text?: string }) => !part.thought && part.text)
    .map((part: { text: string }) => part.text)
    .join("");
  if (!text) {
    const reason = json.promptFeedback?.blockReason ?? candidate?.finishReason ?? "empty";
    throw new GeminiError(`no output from ${model} (${reason})`, 200);
  }
  return text;
}

// Free-tier models get "high demand" spells (503, or a request that hangs). A busy model is
// skipped for the rest of the run and the next one in the list is tried.
const busy = new Set<string>();

export async function generateJson<T extends z.ZodType>(options: {
  apiKey: string;
  models: string[];
  system: string;
  input: string;
  schema: T;
}): Promise<{ model: string; output: z.infer<T> }> {
  const schema: Record<string, unknown> = z.toJSONSchema(options.schema);
  delete schema.$schema;
  const body = {
    systemInstruction: { parts: [{ text: options.system }] },
    contents: [{ role: "user", parts: [{ text: options.input }] }],
    generationConfig: {
      responseFormat: { text: { mimeType: "APPLICATION_JSON", schema } },
      thinkingConfig: { thinkingLevel: "low" },
    },
  };

  let last: GeminiError | null = null;
  for (const model of options.models) {
    if (busy.has(model)) continue;
    try {
      const text = await request(options.apiKey, model, body);
      return { model, output: options.schema.parse(JSON.parse(text)) };
    } catch (error) {
      if (!(error instanceof GeminiError) || ![500, 503, 504].includes(error.status)) throw error;
      console.warn(`${model} is busy (${error.status}); trying the next model.`);
      busy.add(model);
      last = error;
    }
  }
  throw last ?? new GeminiError("every model is busy", 503);
}
