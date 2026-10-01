import { z } from "zod";

/**
 * Environment variables, validated once.
 * Public values are safe for the browser. Server values must never be imported
 * from client components; `serverEnv` throws if accessed in the browser.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MAILCHIMP_API_KEY: z.string().min(1).optional(),
  MAILCHIMP_SERVER_PREFIX: z.string().min(1).optional(),
  MAILCHIMP_AUDIENCE_ID: z.string().min(1).optional(),
  SKOOL_INVITE_URL: z.string().url().optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called in the browser");
  }
  return serverSchema.parse(process.env);
}
