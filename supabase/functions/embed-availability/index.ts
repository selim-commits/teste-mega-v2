import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

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
    const serviceId = url.searchParams.get("serviceId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!studioId || !serviceId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "studioId, serviceId, startDate, and endDate are required",
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

    // Fetch existing bookings for the date range
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("space_id", serviceId)
      .gte("start_time", `${startDate}T00:00:00`)
      .lte("end_time", `${endDate}T23:59:59`)
      .in("status", ["confirmed", "pending"]);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch availability" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate availability for each day in the range
    const availability: DayAvailability[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const slots: TimeSlot[] = [];

      // Generate hourly slots from 9am to 9pm
      for (let hour = 9; hour <= 21; hour++) {
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
        const slotStart = new Date(`${dateStr}T${timeStr}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour later

        // Check if this slot overlaps with any existing booking
        const isBooked = bookings?.some((booking) => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        slots.push({
          time: timeStr,
          available: !isBooked,
        });
      }

      availability.push({
        date: dateStr,
        slots,
      });
    }

    return new Response(JSON.stringify({ data: availability }), {
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
