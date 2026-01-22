import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type ServiceType = Database["public"]["Enums"]["service_type"];
type QueueStatus = Database["public"]["Enums"]["queue_status"];

export type { Customer, ServiceType, QueueStatus };

// Service duration in minutes based on type
export const SERVICE_DURATIONS: Record<ServiceType, number> = {
  "Haircut": 30,
  "Shave": 20,
  "Facial": 45,
  "Hair Color": 60,
  "Beard Trim": 15,
  "Full Package": 90,
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
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
    try {
      const { error } = await supabase.from("customers").insert({
        customer_name: name.trim(),
        service_type: serviceType,
        estimated_duration_minutes: SERVICE_DURATIONS[serviceType],
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
    fetchCustomers();

    const channel = supabase
      .channel("customers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    customers,
    isLoading,
    addCustomer,
    updateStatus,
    removeCustomer,
    getEstimatedWaitTime,
  };
}
