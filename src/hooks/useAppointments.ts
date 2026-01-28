import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
type ServiceType = Database["public"]["Enums"]["service_type"];

export type { Appointment, AppointmentStatus };

export function useAppointments(salonId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("salon_id", salonId)
        .gte("appointment_time", new Date().toISOString().split("T")[0])
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching appointments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (
    customerName: string,
    serviceType: ServiceType,
    appointmentTime: Date,
    phoneNumber?: string,
    notes?: string
  ) => {
    if (!salonId) return null;

    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          salon_id: salonId,
          customer_name: customerName.trim(),
          service_type: serviceType,
          appointment_time: appointmentTime.toISOString(),
          phone_number: phoneNumber?.trim() || null,
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment booked",
        description: `Appointment for ${customerName} scheduled.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error booking appointment",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Appointment updated",
        description: `Status changed to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error cancelling appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchAppointments();

      const channel = supabase
        .channel(`appointments-${salonId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `salon_id=eq.${salonId}`,
          },
          () => fetchAppointments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [salonId]);

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    refetch: fetchAppointments,
  };
}
