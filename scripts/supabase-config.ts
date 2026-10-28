// Runs `supabase config diff|push` against the hosted project with the secrets that
// supabase/config.toml reads through env(...). Only those keys are taken from .env.local.
// Usage: npm run db:config -- diff | npm run db:config -- push [--yes]
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [command, ...rest] = process.argv.slice(2);
if (command !== "diff" && command !== "push") {
  console.error("Usage: npm run db:config -- diff | push [--yes]");
  process.exit(1);
}

const config = readFileSync("supabase/config.toml", "utf8");
const wanted = new Set([...config.matchAll(/env\(([A-Z0-9_]+)\)/g)].map((match) => match[1]));

const secrets: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && wanted.has(match[1]) && match[2]) {
    secrets[match[1]] = match[2].trim().replace(/^"(.*)"$/, "$1");
  }
}
console.log(`Passing ${Object.keys(secrets).sort().join(", ") || "no secrets"} to the CLI.`);

const result = spawnSync("npx", ["supabase", "config", command, ...rest], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ...secrets },
});
process.exit(result.status ?? 1);
