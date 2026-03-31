import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSalons, type Salon } from "@/hooks/useSalons";
import { useSalonRatings } from "@/hooks/useRatings";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Users, Scissors, LogIn, ChevronRight, Calendar, Star } from "lucide-react";
import { SERVICE_DURATIONS } from "@/hooks/useCustomers";
import { SalonFilters } from "@/components/SalonFilters";
import { RatingDisplay } from "@/components/RatingDisplay";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type SortOption = "distance" | "rating" | "wait_time" | "open";

interface PublicQueueViewProps {
  onLoginClick: () => void;
}

export function PublicQueueView({ onLoginClick }: PublicQueueViewProps) {
  const navigate = useNavigate();
  const { salons, isLoading, userLocation, getNearbySalons } = useSalons();
  const { salonRatings, fetchAllRatings } = useSalonRatings();
  const [salonQueues, setSalonQueues] = useState<Record<string, Customer[]>>({});
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch ratings when salons load
  useEffect(() => {
    if (salons.length > 0) {
      fetchAllRatings(salons.map((s) => s.id));
    }
  }, [salons]);

  // Fetch queue for all salons
  useEffect(() => {
    const fetchAllQueues = async () => {
      if (salons.length === 0) return;

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .in("salon_id", salons.map((s) => s.id))
        .in("status", ["Waiting", "Serving"])
        .eq("request_status", "approved")
        .order("queue_number", { ascending: true });

      if (error) {
        console.error("Error fetching queues:", error);
        return;
      }

      // Group by salon_id
      const grouped: Record<string, Customer[]> = {};
      data?.forEach((customer) => {
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
        () => fetchAllQueues()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salons]);

  const getQueueStats = (salonId: string) => {
    const queue = salonQueues[salonId] || [];
    const waiting = queue.filter((c) => c.status === "Waiting").length;
    const serving = queue.filter((c) => c.status === "Serving").length;
    const estimatedWait = queue
      .filter((c) => c.status === "Waiting")
      .reduce((acc, c) => acc + c.estimated_duration_minutes, 0);

    return { waiting, serving, estimatedWait };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "bg-[hsl(var(--status-waiting))] text-[hsl(var(--status-waiting-foreground))]";
      case "Serving":
        return "bg-[hsl(var(--status-serving))] text-[hsl(var(--status-serving-foreground))]";
      default:
        return "bg-muted";
    }
  };

  // Get filtered and sorted salons
  const filteredSalons = useMemo(() => {
    let result = getNearbySalons(radius);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query)
      );
    }

    // Sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        case "rating":
          const ratingA = salonRatings[a.id]?.avg || 0;
          const ratingB = salonRatings[b.id]?.avg || 0;
          return ratingB - ratingA;
        case "wait_time":
          const waitA = getQueueStats(a.id).estimatedWait;
          const waitB = getQueueStats(b.id).estimatedWait;
          return waitA - waitB;
        case "open":
          const openA = (a as any).is_open ?? true;
          const openB = (b as any).is_open ?? true;
          if (openA === openB) return 0;
          return openA ? -1 : 1;
        default:
          return 0;
      }
    });
  }, [salons, sortBy, radius, searchQuery, salonRatings, salonQueues, userLocation]);

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
    const rating = salonRatings[selectedSalon.id];

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedSalon(null)}>
              ← Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{selectedSalon.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {selectedSalon.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedSalon.address}
                  </p>
                )}
                {rating && <RatingDisplay rating={rating.avg} count={rating.count} />}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/checkin/${selectedSalon.id}`)}
              >
                <Users className="w-4 h-4 mr-2" />
                Join Queue
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/book/${selectedSalon.id}`)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {/* Service-based queue view */}
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            {(["Haircut", "Shave", "Facial"] as const).map((service) => {
              const serviceQueue = queue.filter((c) => c.service_type === service);
              const waitTime = serviceQueue.filter((c) => c.status === "Waiting")
                .reduce((acc, c) => acc + c.estimated_duration_minutes, 0);

              return (
                <Card key={service}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{service}</h3>
                      <Badge variant="secondary">~{SERVICE_DURATIONS[service]} min</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{serviceQueue.filter((c) => c.status === "Waiting").length} waiting</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{waitTime} min wait
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4">
            {queue.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No customers in queue</p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate(`/checkin/${selectedSalon.id}`)}
                  >
                    Be the first to join!
                  </Button>
                </CardContent>
              </Card>
            ) : (
              queue.map((customer) => (
                <Card
                  key={customer.id}
                  className={customer.status === "Serving" ? "border-[hsl(var(--status-serving))]" : ""}
                >
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
                        <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
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

      <main className="container mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <SalonFilters
          currentSort={sortBy}
          currentRadius={radius}
          onSortChange={setSortBy}
          onRadiusChange={setRadius}
          onSearchChange={setSearchQuery}
        />

        {filteredSalons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No salons found nearby</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try increasing the search radius
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSalons.map((salon) => {
              const stats = getQueueStats(salon.id);
              const rating = salonRatings[salon.id];
              const isOpen = salon.is_open ?? true;

              return (
                <Card
                  key={salon.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !isOpen ? "opacity-60" : ""
                  }`}
                  onClick={() => setSelectedSalon(salon)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{salon.name}</h3>
                          <Badge
                            variant={isOpen ? "default" : "destructive"}
                            className={
                              isOpen
                                ? "bg-[hsl(var(--status-serving))] text-xs"
                                : "bg-[hsl(var(--status-closed))] text-xs"
                            }
                          >
                            {isOpen ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        {salon.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {salon.address}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {salon.distance !== undefined && (
                            <p className="text-xs text-primary">{salon.distance.toFixed(1)} km away</p>
                          )}
                          {rating && <RatingDisplay rating={rating.avg} count={rating.count} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{stats.waiting} waiting</span>
                          </div>
                          {stats.serving > 0 && (
                            <Badge className="bg-[hsl(var(--status-serving))] text-white mt-1">
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
