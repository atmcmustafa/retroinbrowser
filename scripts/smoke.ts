import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { serverEnv } from "@/lib/env.server";
import { artworkBucket } from "@/lib/images";
import type { Enums, Json, TablesInsert } from "@/types/database";
import { createScriptClient } from "./lib/db";

// Weekly: opens every published port in headless Chrome, waits, and keeps a screenshot plus
// what the page logged, for /admin/screenshots. Runners have no GPU, so WebGPU ports often
// show their "not supported" screen; that still shows the site is up. Nothing here changes
// the public game row (docs/AUTOMATION.md, section 5).

const WAIT_MS = 10_000;
const PORT = 9333;
const CHROME =
  serverEnv.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : "google-chrome");

type Message = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
  result?: Record<string, unknown>;
  error?: { message: string };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  let version: { webSocketDebuggerUrl: string } | null = null;
  for (let i = 0; i < 80 && !version; i++) {
    version = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      .then((res) => res.json())
      .catch(() => null);
    if (!version) await sleep(250);
  }
  if (!version) throw new Error("Chrome didn't start");

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let seq = 0;
  const pending = new Map<number, (message: Message) => void>();
  const listeners = new Set<(message: Message) => void>();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as Message;
    if (message.id !== undefined) pending.get(message.id)?.(message);
    else for (const listener of listeners) listener(message);
  });
  const send = (method: string, params: object = {}, sessionId?: string) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (message) => {
        pending.delete(id);
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result ?? {});
      });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  return { ws, send, listeners };
}

type Browser = Awaited<ReturnType<typeof connect>>;

// Each game gets a fresh browser context, so one site's storage or service worker can't
// affect the next.
async function visit({ send, listeners }: Browser, url: string) {
  const { browserContextId } = await send("Target.createBrowserContext", { disposeOnDetach: true });
  const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = (await send("Target.attachToTarget", { targetId, flatten: true })) as {
    sessionId: string;
  };

  const errors: string[] = [];
  let status: number | null = null;
  const listener = (message: Message) => {
    if (message.sessionId !== sessionId) return;
    const params = message.params ?? {};
    if (message.method === "Runtime.exceptionThrown") {
      const details = params.exceptionDetails as {
        exception?: { description?: string };
        text?: string;
      };
      errors.push((details.exception?.description ?? details.text ?? "exception").slice(0, 200));
    } else if (message.method === "Runtime.consoleAPICalled" && params.type === "error") {
      const args = params.args as { value?: unknown; description?: string }[];
      errors.push(
        args
          .map((arg) => String(arg.value ?? arg.description ?? ""))
          .join(" ")
          .slice(0, 200),
      );
    } else if (
      message.method === "Network.responseReceived" &&
      params.type === "Document" &&
      status === null
    ) {
      status = (params.response as { status: number }).status;
    }
  };
  listeners.add(listener);

  const started = Date.now();
  try {
    await send("Runtime.enable", {}, sessionId);
    await send("Network.enable", {}, sessionId);
    await send("Page.enable", {}, sessionId);
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );
    const navigated = await send("Page.navigate", { url }, sessionId);
    if (navigated.errorText) throw new Error(String(navigated.errorText));
    await sleep(WAIT_MS);

    const probe = (await send(
      "Runtime.evaluate",
      {
        expression: `JSON.stringify({ href: location.href, title: document.title, canvas: document.querySelectorAll("canvas").length })`,
        returnByValue: true,
      },
      sessionId,
    )) as { result: { value: string } };
    const page = JSON.parse(probe.result.value) as { href: string; title: string; canvas: number };
    const shot = (await send("Page.captureScreenshot", { format: "png" }, sessionId)) as {
      data: string;
    };
    return {
      status,
      errors,
      ms: Date.now() - started,
      page,
      png: Buffer.from(shot.data, "base64"),
    };
  } finally {
    listeners.delete(listener);
    await send("Target.closeTarget", { targetId }).catch(() => {});
    await send("Target.disposeBrowserContext", { browserContextId }).catch(() => {});
  }
}

async function main() {
  const db = createScriptClient();
  const { data: games, error } = await db
    .from("games")
    .select("id, slug, play_url")
    .eq("status", "published")
    .order("slug");
  if (error) throw error;

  const profile = mkdtempSync(join(tmpdir(), "smoke-"));
  // Pages are third-party sites, so Chrome's environment carries none of our keys. Ubuntu
  // runners block the sandbox's user namespaces, so Chrome runs without one there.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/SECRET|KEY|TOKEN|PASSWORD|WEBHOOK/i.test(name),
    ),
  ) as NodeJS.ProcessEnv;
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--mute-audio",
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--window-size=1280,720",
      ...(process.platform === "linux" ? ["--no-sandbox"] : []),
      "about:blank",
    ],
    { stdio: "ignore", env },
  );

  try {
    const browser = await connect();
    for (const game of games) {
      const row: TablesInsert<"link_checks"> = {
        game_id: game.id,
        kind: "smoke",
        verdict: "unknown",
      };
      try {
        const result = await Promise.race([
          visit(browser, game.play_url),
          sleep(45_000).then(() => {
            throw new Error("timed out");
          }),
        ]);
        const image = await sharp(result.png).resize(960, 540).webp({ quality: 70 }).toBuffer();
        const path = `smoke/${game.slug}.webp`;
        const bucket = db.storage.from(artworkBucket);
        const upload = await bucket.upload(path, image, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });
        if (upload.error) throw upload.error;

        const challenge = /^(just a moment|attention required|bir dakika)/i.test(result.page.title);
        const verdict: Enums<"link_status"> = challenge
          ? "unknown"
          : result.status !== null && result.status >= 400
            ? "broken"
            : "ok";
        Object.assign(row, {
          verdict,
          http_status: result.status,
          final_url: /^https?:\/\//.test(result.page.href) ? result.page.href : null,
          response_ms: result.ms,
          page_title: result.page.title.slice(0, 300) || null,
          error: result.errors[0] ?? null,
          details: {
            screenshot: `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`,
            canvas: result.page.canvas > 0,
            console_errors: result.errors.slice(0, 5),
          } as Json,
        });
        console.log(
          `${verdict.padEnd(8)} ${game.slug} (${result.status ?? "?"}, ${result.errors.length} errors, canvas: ${result.page.canvas > 0})`,
        );
      } catch (visitError) {
        Object.assign(row, { verdict: "broken", error: String(visitError).slice(0, 300) });
        console.log(`broken   ${game.slug} ${row.error}`);
      }
      const saved = await db.from("link_checks").insert(row);
      if (saved.error)
        console.warn(`Couldn't save the result for ${game.slug}: ${saved.error.message}`);
    }
    browser.ws.close();
  } finally {
    chrome.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
