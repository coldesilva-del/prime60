import "server-only";

import { createHash } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Minimal Mailchimp Marketing API v3 client using fetch. No SDK.
 * Only the email, first name and the tag `prime60-app` ever leave the server.
 * When the API key or audience id is not configured every call returns
 * `{ skipped: true }` so consent can be stored without a Mailchimp account.
 */

export const MAILCHIMP_TAG = "prime60-app";

export type MailchimpResult =
  | { ok: true; skipped?: false }
  | { ok: false; skipped?: false; status: number; detail: string }
  | { ok: true; skipped: true };

export interface MailchimpConfig {
  apiKey: string;
  server: string;
  audienceId: string;
}

/** Lowercased MD5 of the lowercased email, as Mailchimp identifies members. */
export function memberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

/** Resolves config from the environment. Returns null when not configured. */
export function mailchimpConfig(): MailchimpConfig | null {
  const env = serverEnv();
  const apiKey = env.MAILCHIMP_API_KEY;
  const audienceId = env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !audienceId) return null;
  // Keys look like "abc123-us21"; the suffix is the data centre.
  const fromKey = apiKey.includes("-") ? apiKey.slice(apiKey.lastIndexOf("-") + 1) : "";
  const server = env.MAILCHIMP_SERVER_PREFIX ?? fromKey;
  if (!server) return null;
  return { apiKey, server, audienceId };
}

export function memberUrl(config: MailchimpConfig, email: string): string {
  return `https://${config.server}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${memberHash(email)}`;
}

function headers(config: MailchimpConfig): HeadersInit {
  const token = Buffer.from(`anystring:${config.apiKey}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiError(res: Response): Promise<MailchimpResult> {
  let detail = res.statusText;
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    detail = body.detail ?? body.title ?? detail;
  } catch {
    // Non-JSON error body; keep the status text.
  }
  return { ok: false, status: res.status, detail };
}

export interface UpsertMemberInput {
  email: string;
  firstName?: string | null;
  tags?: string[];
}

/**
 * Adds or updates the member, subscribed if new, then applies the tags
 * (default: `prime60-app`).
 */
export async function upsertMember(input: UpsertMemberInput): Promise<MailchimpResult> {
  const config = mailchimpConfig();
  if (!config) return { ok: true, skipped: true };

  const email = input.email.trim().toLowerCase();
  const tags = input.tags && input.tags.length > 0 ? input.tags : [MAILCHIMP_TAG];

  const putRes = await fetch(memberUrl(config, email), {
    method: "PUT",
    headers: headers(config),
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: { FNAME: input.firstName?.trim() ?? "" },
    }),
  });
  if (!putRes.ok) return apiError(putRes);

  const tagRes = await fetch(`${memberUrl(config, email)}/tags`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({ tags: tags.map((name) => ({ name, status: "active" })) }),
  });
  if (!tagRes.ok) return apiError(tagRes);

  return { ok: true };
}

/** Removes the `prime60-app` tag. The member stays in the audience. */
export async function removeTag(email: string, tag: string = MAILCHIMP_TAG): Promise<MailchimpResult> {
  const config = mailchimpConfig();
  if (!config) return { ok: true, skipped: true };

  const res = await fetch(`${memberUrl(config, email.trim().toLowerCase())}/tags`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({ tags: [{ name: tag, status: "inactive" }] }),
  });
  // A member that was never created is not an error for our purposes.
  if (!res.ok && res.status !== 404) return apiError(res);
  return { ok: true };
}
