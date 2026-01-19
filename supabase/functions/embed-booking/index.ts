import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BookingRequest {
  studioId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}

function generateReferenceNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: BookingRequest = await req.json();

    const {
      studioId,
      serviceId,
      date,
      startTime,
      endTime,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = body;

    // Validate required fields
    if (
      !studioId ||
      !serviceId ||
      !date ||
      !startTime ||
      !endTime ||
      !clientName ||
      !clientEmail
    ) {
      return new Response(
        JSON.stringify({
          error:
            "studioId, serviceId, date, startTime, endTime, clientName, and clientEmail are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find or create client
    let clientId: string;

    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("studio_id", studioId)
      .eq("email", clientEmail)
      .single();

    if (existingClient) {
      clientId = existingClient.id;

      // Update client info if needed
      await supabase
        .from("clients")
        .update({
          name: clientName,
          phone: clientPhone || null,
        })
        .eq("id", clientId);
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          studio_id: studioId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone || null,
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("Error creating client:", clientError);
        return new Response(
          JSON.stringify({ error: "Failed to create client" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      clientId = newClient.id;
    }

    // Create booking
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;
    const referenceNumber = generateReferenceNumber();

    // Calculate total amount based on space rates
    const { data: space } = await supabase
      .from("spaces")
      .select("hourly_rate")
      .eq("id", serviceId)
      .single();

    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const hours = endHour - startHour;
    const totalAmount = space?.hourly_rate
      ? parseFloat(space.hourly_rate) * hours
      : 0;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        studio_id: studioId,
        space_id: serviceId,
        client_id: clientId,
        start_time: startDateTime,
        end_time: endDateTime,
        status: "pending",
        total_amount: totalAmount,
        notes: notes || null,
      })
      .select("id, start_time, end_time, status, total_amount")
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: {
          ...booking,
          referenceNumber,
          clientName,
          clientEmail,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
