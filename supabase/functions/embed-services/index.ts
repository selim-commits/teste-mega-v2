import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const studioId = url.searchParams.get("studioId");
    const servicesFilter = url.searchParams.get("services");

    if (!studioId) {
      return new Response(
        JSON.stringify({ error: "studioId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("spaces")
      .select(
        "id, name, description, hourly_rate, half_day_rate, full_day_rate, min_booking_hours, max_booking_hours, image_url, amenities"
      )
      .eq("studio_id", studioId)
      .eq("is_active", true);

    // Apply optional services filter
    if (servicesFilter) {
      const serviceIds = servicesFilter.split(",").map((id) => id.trim());
      query = query.in("id", serviceIds);
    }

    const { data: spaces, error } = await query;

    if (error) {
      console.error("Error fetching spaces:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch services" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ data: spaces }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
