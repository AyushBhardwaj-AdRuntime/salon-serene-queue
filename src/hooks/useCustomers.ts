import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type ServiceType = Database["public"]["Enums"]["service_type"];
type QueueStatus = Database["public"]["Enums"]["queue_status"];
type QueueRequestStatus = Database["public"]["Enums"]["queue_request_status"];

export type { Customer, ServiceType, QueueStatus, QueueRequestStatus };

// Service duration in minutes based on type
export const SERVICE_DURATIONS: Record<ServiceType, number> = {
  "Haircut": 30,
  "Shave": 20,
  "Facial": 45,
  "Hair Color": 60,
  "Beard Trim": 15,
  "Full Package": 90,
};

export function useCustomers(salonId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch customers for specific salon
  const fetchCustomers = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("salon_id", salonId)
        .order("queue_number", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching queue",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add customer
  const addCustomer = async (name: string, serviceType: ServiceType) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "No salon selected",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.from("customers").insert({
        customer_name: name.trim(),
        service_type: serviceType,
        estimated_duration_minutes: SERVICE_DURATIONS[serviceType],
        salon_id: salonId,
      });

      if (error) throw error;

      toast({
        title: "Customer added",
        description: `${name} has been added to the queue.`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update customer status
  const updateStatus = async (id: string, status: QueueStatus) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Customer status changed to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Approve queue request
  const approveRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ request_status: "approved" as QueueRequestStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Request approved",
        description: "Customer has been added to the queue.",
      });
    } catch (error: any) {
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Reject queue request
  const rejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ request_status: "rejected" as QueueRequestStatus, status: "Done" as QueueStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "The queue request has been rejected.",
      });
    } catch (error: any) {
      toast({
        title: "Error rejecting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Remove customer
  const removeCustomer = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Customer removed",
        description: `${name} has been removed from the queue.`,
      });
    } catch (error: any) {
      toast({
        title: "Error removing customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Calculate estimated wait time
  const getEstimatedWaitTime = (customer: Customer): number => {
    const waitingCustomers = customers.filter(
      (c) =>
        c.status === "Waiting" &&
        c.queue_number < customer.queue_number
    );

    const servingCustomer = customers.find((c) => c.status === "Serving");
    let totalWait = waitingCustomers.reduce(
      (acc, c) => acc + c.estimated_duration_minutes,
      0
    );

    if (servingCustomer && customer.status === "Waiting") {
      // Add remaining time for currently serving customer (estimate half remaining)
      totalWait += Math.round(servingCustomer.estimated_duration_minutes / 2);
    }

    return totalWait;
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (salonId) {
      fetchCustomers();

      const channel = supabase
        .channel(`customers-changes-${salonId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "customers",
            filter: `salon_id=eq.${salonId}`,
          },
          () => {
            fetchCustomers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [salonId]);

  return {
    customers,
    isLoading,
    addCustomer,
    updateStatus,
    approveRequest,
    rejectRequest,
    removeCustomer,
    getEstimatedWaitTime,
  };
}
