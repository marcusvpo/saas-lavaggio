/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck: Missing types for Deno imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: users, error: listError } = await supabaseAdmin.auth.admin
      .listUsers();

    if (listError) {
      throw listError;
    }

    // Fetch user roles to supplement auth data
    const { data: roles } = await supabaseAdmin.from("user_roles").select(
      "id, role, store_id, stores(name)",
    );

    // Map through the users and attach the role info
    const enrichedUsers = users.users.map((u) => {
      const dbRole = roles?.find((r) => r.id === u.id);
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: dbRole?.role || "user",
        store_id: dbRole?.store_id || null,
        store_name: dbRole?.stores?.name || null,
      };
    });

    return new Response(JSON.stringify({ users: enrichedUsers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in get-users func:", error);
    let errorMessage = "An unexpected error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
