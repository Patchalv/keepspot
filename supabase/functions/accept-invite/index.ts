import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Parse and validate input
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Invite token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Accept invite atomically via Postgres function
    const { data, error: rpcError } = await supabase.rpc("accept_invite", {
      p_token: token.trim(),
      p_user_id: user.id,
    });

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes("INVITE_NOT_FOUND")) {
        return new Response(
          JSON.stringify({ error: "This invite link is invalid", code: "INVITE_NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      if (msg.includes("INVITE_EXPIRED")) {
        return new Response(
          JSON.stringify({ error: "This invite has expired", code: "INVITE_EXPIRED" }),
          { status: 410, headers: { "Content-Type": "application/json" } },
        );
      }
      if (msg.includes("INVITE_MAX_USES")) {
        return new Response(
          JSON.stringify({ error: "This invite has reached its maximum uses", code: "INVITE_MAX_USES" }),
          { status: 410, headers: { "Content-Type": "application/json" } },
        );
      }
      if (msg.includes("ALREADY_MEMBER")) {
        return new Response(
          JSON.stringify({ error: "You are already a member of this map", code: "ALREADY_MEMBER" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to join map" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ mapId: data.map_id, mapName: data.map_name, role: data.role }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
