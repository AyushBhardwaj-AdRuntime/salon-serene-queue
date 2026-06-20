import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckinRequest {
  salon_id: string;
  customer_name: string;
  service_type: "Haircut" | "Shave" | "Facial" | "Hair Color" | "Beard Trim" | "Full Package";
  service_id?: string | null;
  phone_number?: string;
  require_approval?: boolean;
}

const SERVICE_DURATIONS: Record<string, number> = {
  "Haircut": 30,
  "Shave": 20,
  "Facial": 45,
  "Hair Color": 60,
  "Beard Trim": 15,
  "Full Package": 90,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { salon_id, customer_name, service_type, phone_number, require_approval }: CheckinRequest = await req.json();

    // Validate inputs
    if (!salon_id || !customer_name || !service_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate customer name length
    const trimmedName = customer_name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Customer name must be between 1 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate service type
    if (!SERVICE_DURATIONS[service_type]) {
      return new Response(
        JSON.stringify({ error: "Invalid service type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify salon exists and check status
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, name, is_open, is_queue_paused")
      .eq("id", salon_id)
      .single();

    if (salonError || !salon) {
      return new Response(
        JSON.stringify({ error: "Salon not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if salon is open
    if (salon.is_open === false) {
      return new Response(
        JSON.stringify({ error: "Salon is currently closed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if queue is paused
    if (salon.is_queue_paused === true) {
      return new Response(
        JSON.stringify({ error: "Queue is temporarily paused" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert customer into queue using service role (bypasses RLS)
    const { data: customer, error: insertError } = await supabase
      .from("customers")
      .insert({
        customer_name: trimmedName,
        service_type,
        estimated_duration_minutes: SERVICE_DURATIONS[service_type],
        salon_id,
        phone_number: phone_number?.trim() || null,
        request_status: require_approval ? "pending" : "approved",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to add to queue" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        queue_number: customer.queue_number,
        salon_name: salon.name,
        estimated_duration: SERVICE_DURATIONS[service_type],
        request_status: require_approval ? "pending" : "approved",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
