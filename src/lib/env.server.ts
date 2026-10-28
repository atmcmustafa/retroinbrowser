import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  STEAMGRIDDB_API_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  REVALIDATE_SECRET: z.string().min(32).optional(),
  // Only the discovery scripts read these (docs/AUTOMATION.md).
  GEMINI_API_KEY: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.url().optional(),
  GITHUB_TOKEN: z.string().optional(),
  CHROME_PATH: z.string().optional(),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  STEAMGRIDDB_API_KEY: process.env.STEAMGRIDDB_API_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || undefined,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
  CHROME_PATH: process.env.CHROME_PATH || undefined,
});
