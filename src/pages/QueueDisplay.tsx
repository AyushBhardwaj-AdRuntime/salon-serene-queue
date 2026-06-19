import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Clock, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import type { Customer } from "@/hooks/useCustomers";

interface Salon {
  id: string;
  name: string;
}

export default function QueueDisplay() {
  const { salonId } = useParams<{ salonId: string }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch salon details
  useEffect(() => {
    const fetchSalon = async () => {
      if (!salonId) return;

      const { data } = await supabase
        .from("salons")
        .select("id, name")
        .eq("id", salonId)
        .maybeSingle();

      setSalon(data);
      setIsLoading(false);
    };

    fetchSalon();
  }, [salonId]);

  // Fetch and poll queue updates (PII-free public RPC)
  useEffect(() => {
    if (!salonId) return;

    const fetchCustomers = async () => {
      const { data } = await supabase.rpc("get_public_queue", {
        _salon_ids: [salonId],
      });
      const sorted = (data || []).sort(
        (a: any, b: any) => a.queue_number - b.queue_number
      );
      setCustomers(sorted as Customer[]);
    };

    fetchCustomers();
    const interval = setInterval(fetchCustomers, 5000);
    return () => clearInterval(interval);
  }, [salonId]);

  const servingCustomer = customers.find((c) => c.status === "Serving");
  const waitingCustomers = customers.filter((c) => c.status === "Waiting");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Scissors className="w-24 h-24 text-primary animate-pulse" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground">Salon Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        title={salon.name}
        subtitle="Live Queue Display"
        right={
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-mono font-bold text-foreground leading-none">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        }
      />
      <div className="p-8 flex-1 flex flex-col">


      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Now Serving - Large Display */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 h-full flex flex-col shadow-2xl shadow-primary/20">
            <h2 className="text-2xl font-semibold text-primary-foreground mb-4 flex items-center gap-3">
              <div className="w-4 h-4 bg-primary-foreground rounded-full animate-pulse" />
              NOW SERVING
            </h2>
            {servingCustomer ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-9xl font-bold text-primary-foreground mb-6">
                  #{servingCustomer.queue_number}
                </div>
                <div className="text-xl text-primary-foreground/70 mt-2">
                  {servingCustomer.service_type}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-2xl text-primary-foreground/70">No one being served</p>
              </div>
            )}
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-3xl p-8 h-full border">
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Clock className="w-7 h-7 text-muted-foreground" />
              WAITING ({waitingCustomers.length})
            </h2>
            
            {waitingCustomers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                {waitingCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className={`flex items-center gap-6 p-6 rounded-2xl transition-all ${
                      index === 0
                        ? "bg-accent border-2 border-primary"
                        : "bg-muted/50"
                    }`}
                  >
                    <div
                      className={`text-5xl font-bold ${
                        index === 0 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      #{customer.queue_number}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg text-muted-foreground flex items-center gap-2">
                        <span>{customer.service_type}</span>
                        <span className="text-sm">• ~{customer.estimated_duration_minutes} min</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        NEXT
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
                <User className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-2xl">No customers waiting</p>
                <p className="text-lg mt-2">Scan the QR code to join the queue!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-muted-foreground">
        <p className="text-lg">Thank you for your patience!</p>
      </footer>
      </div>
    </div>
  );
}
