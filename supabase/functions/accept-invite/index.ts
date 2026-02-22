import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Parse and validate input
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Invite token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Look up invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("map_invites")
      .select("id, map_id, role, expires_at, max_uses, use_count")
      .eq("token", token.trim())
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "This invite link is invalid", code: "INVITE_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invite has expired", code: "INVITE_EXPIRED" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. Check max uses
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return new Response(
        JSON.stringify({ error: "This invite has reached its maximum uses", code: "INVITE_MAX_USES" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 6. Check if user is already a member
    const { data: existingMember } = await supabase
      .from("map_members")
      .select("id")
      .eq("map_id", invite.map_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: "You are already a member of this map", code: "ALREADY_MEMBER" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 7. Add user to map_members
    const { error: memberError } = await supabase
      .from("map_members")
      .insert({ map_id: invite.map_id, user_id: user.id, role: invite.role });

    if (memberError) {
      return new Response(
        JSON.stringify({ error: "Failed to join map" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 8. Increment use_count
    const { error: updateError } = await supabase
      .from("map_invites")
      .update({ use_count: invite.use_count + 1 })
      .eq("id", invite.id);

    if (updateError) {
      // Non-fatal: membership was already created, just log
      console.error("Failed to increment invite use_count:", updateError);
    }

    // 9. Fetch map name for response
    const { data: map, error: mapError } = await supabase
      .from("maps")
      .select("name")
      .eq("id", invite.map_id)
      .single();

    if (mapError || !map) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch map details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ mapId: invite.map_id, mapName: map.name, role: invite.role }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
