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
