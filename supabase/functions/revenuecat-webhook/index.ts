import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
]);

const REVOKE_EVENTS = new Set(["EXPIRATION", "REFUND"]);

serve(async (req) => {
  try {
    // 1. Verify webhook secret
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 2. Parse event
    const body = await req.json();
    const event = body.event;

    if (!event?.type || !event?.app_user_id) {
      return new Response(
        JSON.stringify({ error: "Invalid event payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { type, app_user_id } = event;

    // 3. Skip anonymous RevenueCat users
    if (app_user_id.startsWith("$RCAnonymousID:")) {
      return new Response(
        JSON.stringify({ message: "Skipped anonymous user" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 4. Determine action
    let entitlement: string | null = null;

    if (GRANT_EVENTS.has(type)) {
      entitlement = "premium";
    } else if (REVOKE_EVENTS.has(type)) {
      entitlement = "free";
    } else {
      // CANCELLATION, BILLING_ISSUE, etc. — no action needed
      return new Response(
        JSON.stringify({ message: `No action for event type: ${type}` }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 5. Update profile entitlement
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ entitlement })
      .eq("id", app_user_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile entitlement" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 6. Sync MailerLite group membership (best-effort — never block 200)
    try {
      const mlApiKey = Deno.env.get("MAILERLITE_API_KEY");
      const freeGroupId = Deno.env.get("MAILERLITE_FREE_GROUP_ID");
      const premiumGroupId = Deno.env.get("MAILERLITE_PREMIUM_GROUP_ID");

      if (mlApiKey && freeGroupId && premiumGroupId) {
        const { data: authData, error: mlUserError } =
          await supabase.auth.admin.getUserById(app_user_id);

        if (mlUserError || !authData?.user) {
          console.error(
            `MailerLite: could not fetch user ${app_user_id} — skipping group sync`,
          );
        } else {
          const email = authData.user.email ?? "";

          if (email && !email.endsWith("@privaterelay.appleid.com")) {
            const mlHeaders = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${mlApiKey}`,
            };

            // Look up subscriber ID by email.
            // MailerLite POST /api/subscribers only ADDS groups (never removes),
            // so we must have the subscriber ID to remove the old group first.
            // On non-404 failure, skip the swap entirely to avoid leaving the
            // subscriber in both groups.
            const lookupRes = await fetch(
              `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`,
              { headers: mlHeaders, signal: AbortSignal.timeout(10_000) },
            );
            let subscriberId: string | null = null;
            if (lookupRes.ok) {
              subscriberId = (await lookupRes.json()).data?.id ?? null;
            } else if (lookupRes.status === 404) {
              await lookupRes.text(); // not subscribed yet — skip group swap
            } else {
              const body = await lookupRes.text();
              // Non-404 failure: throw so the inner catch logs and skips the swap.
              // POST /api/subscribers only adds groups — without the subscriber ID
              // we cannot remove the old group first, so proceeding would leave
              // the user in both groups.
              throw new Error(
                `MailerLite: subscriber lookup failed for ${email}: ${lookupRes.status} ${body}`,
              );
            }

            const removeGroupId =
              entitlement === "premium" ? freeGroupId : premiumGroupId;
            const addGroupId =
              entitlement === "premium" ? premiumGroupId : freeGroupId;

            // Step 1: Remove from old group
            if (subscriberId) {
              const removeRes = await fetch(
                `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${removeGroupId}`,
                { method: "DELETE", headers: mlHeaders, signal: AbortSignal.timeout(10_000) },
              );
              if (!removeRes.ok && removeRes.status !== 404) {
                console.error(
                  `MailerLite: group removal failed for ${email} (group ${removeGroupId}): ${removeRes.status} ${await removeRes.text()}`,
                );
              } else {
                await removeRes.text(); // consume body
              }
            }

            // Step 2: Add to new group and update entitlement field
            const upsertRes = await fetch(
              "https://connect.mailerlite.com/api/subscribers",
              {
                method: "POST",
                headers: mlHeaders,
                body: JSON.stringify({
                  email,
                  fields: { source: "app", entitlement },
                  groups: [addGroupId],
                }),
                signal: AbortSignal.timeout(10_000),
              },
            );
            if (!upsertRes.ok) {
              console.error(
                `MailerLite: upsert to group ${addGroupId} failed for ${email}: ${upsertRes.status} ${await upsertRes.text()}`,
              );
            } else {
              await upsertRes.text(); // consume body
            }
          }
        }
      }
    } catch (mlErr) {
      console.error("MailerLite group sync error (non-fatal):", mlErr);
    }

    return new Response(
      JSON.stringify({
        message: `Updated user ${app_user_id} to ${entitlement}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("revenuecat-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
