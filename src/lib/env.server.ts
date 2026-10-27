import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  STEAMGRIDDB_API_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  REVALIDATE_SECRET: z.string().min(32).optional(),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  STEAMGRIDDB_API_KEY: process.env.STEAMGRIDDB_API_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
});
