import "server-only";

import { createClient } from "@/lib/supabase/server";
import { removeTag, upsertMember } from "@/lib/mailchimp";
import type { ProfileRow } from "@/lib/supabase/types";

/**
 * Brings Mailchimp in line with the stored consent. Safe to call on every
 * app layout render: it does nothing unless the sync marker and the consent
 * disagree. Errors are logged and swallowed so the UI is never blocked.
 */
export async function ensureMailchimpSynced(profile: Pick<ProfileRow, "user_id" | "first_name" | "marketing_consent" | "mailchimp_synced_at">): Promise<void> {
  const needsAdd = profile.marketing_consent && profile.mailchimp_synced_at === null;
  const needsRemove = !profile.marketing_consent && profile.mailchimp_synced_at !== null;
  if (!needsAdd && !needsRemove) return;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email || data.user?.id !== profile.user_id) return;

    if (needsAdd) {
      const result = await upsertMember({ email, firstName: profile.first_name });
      if (!result.ok) {
        console.error(`[mailchimp] upsert failed for ${profile.user_id}: ${result.status} ${result.detail}`);
        return;
      }
      if (result.skipped) return; // Not configured; consent stays stored for a later sync.
      await supabase
        .from("profiles")
        .update({ mailchimp_synced_at: new Date().toISOString() })
        .eq("user_id", profile.user_id);
      return;
    }

    const result = await removeTag(email);
    if (!result.ok) {
      console.error(`[mailchimp] remove tag failed for ${profile.user_id}: ${result.status} ${result.detail}`);
      return;
    }
    await supabase.from("profiles").update({ mailchimp_synced_at: null }).eq("user_id", profile.user_id);
  } catch (err) {
    console.error("[mailchimp] sync error", err);
  }
}
