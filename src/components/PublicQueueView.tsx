import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSalons, type Salon } from "@/hooks/useSalons";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Users, Scissors, LogIn, ChevronRight } from "lucide-react";
import { SERVICE_DURATIONS } from "@/hooks/useCustomers";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface PublicQueueViewProps {
  onLoginClick: () => void;
}

export function PublicQueueView({ onLoginClick }: PublicQueueViewProps) {
  const { salons, isLoading, userLocation, getNearbySalons } = useSalons();
  const [salonQueues, setSalonQueues] = useState<Record<string, Customer[]>>({});
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  // Fetch queue for all salons
  useEffect(() => {
    const fetchAllQueues = async () => {
      if (salons.length === 0) return;

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .in("salon_id", salons.map(s => s.id))
        .in("status", ["Waiting", "Serving"])
        .order("queue_number", { ascending: true });

      if (error) {
        console.error("Error fetching queues:", error);
        return;
      }

      // Group by salon_id
      const grouped: Record<string, Customer[]> = {};
      data?.forEach(customer => {
        if (customer.salon_id) {
          if (!grouped[customer.salon_id]) {
            grouped[customer.salon_id] = [];
          }
          grouped[customer.salon_id].push(customer);
        }
      });
      setSalonQueues(grouped);
    };

    fetchAllQueues();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public-queue-view")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          fetchAllQueues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salons]);

  const nearbySalons = getNearbySalons(50);

  const getQueueStats = (salonId: string) => {
    const queue = salonQueues[salonId] || [];
    const waiting = queue.filter(c => c.status === "Waiting").length;
    const serving = queue.filter(c => c.status === "Serving").length;
    const estimatedWait = queue
      .filter(c => c.status === "Waiting")
      .reduce((acc, c) => acc + c.estimated_duration_minutes, 0);
    
    return { waiting, serving, estimatedWait };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting": return "bg-status-waiting text-white";
      case "Serving": return "bg-status-serving text-white";
      default: return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading salons...</p>
        </div>
      </div>
    );
  }

  if (selectedSalon) {
    const queue = salonQueues[selectedSalon.id] || [];
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedSalon(null)}>
              ← Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{selectedSalon.name}</h1>
              {selectedSalon.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedSalon.address}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid gap-4">
            {queue.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No customers in queue</p>
                </CardContent>
              </Card>
            ) : (
              queue.map((customer, index) => (
                <Card key={customer.id} className={customer.status === "Serving" ? "border-status-serving" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-primary">
                          #{customer.queue_number}
                        </div>
                        <div>
                          <p className="font-medium">{customer.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{customer.service_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {customer.estimated_duration_minutes} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Nearby Salons</h1>
              {userLocation ? (
                <p className="text-xs text-muted-foreground">Showing salons near you</p>
              ) : (
                <p className="text-xs text-muted-foreground">Enable location for better results</p>
              )}
            </div>
          </div>
          <Button onClick={onLoginClick} variant="outline" size="sm">
            <LogIn className="w-4 h-4 mr-2" />
            Staff Login
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {nearbySalons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No salons found nearby</p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to register your salon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {nearbySalons.map((salon) => {
              const stats = getQueueStats(salon.id);
              return (
                <Card 
                  key={salon.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedSalon(salon)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{salon.name}</h3>
                        {salon.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {salon.address}
                          </p>
                        )}
                        {salon.distance !== undefined && (
                          <p className="text-xs text-primary mt-1">
                            {salon.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{stats.waiting} waiting</span>
                          </div>
                          {stats.serving > 0 && (
                            <Badge className="bg-status-serving text-white mt-1">
                              {stats.serving} serving
                            </Badge>
                          )}
                          {stats.estimatedWait > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              ~{stats.estimatedWait} min wait
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
