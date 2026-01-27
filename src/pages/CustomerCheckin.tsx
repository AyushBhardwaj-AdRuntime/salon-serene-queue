import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scissors, CheckCircle, Clock, ArrowLeft, Users } from "lucide-react";
import type { ServiceType, Customer } from "@/hooks/useCustomers";
import { SERVICE_DURATIONS } from "@/hooks/useCustomers";

const SERVICE_TYPES: ServiceType[] = [
  "Haircut",
  "Shave",
  "Facial",
  "Hair Color",
  "Beard Trim",
  "Full Package",
];

interface Salon {
  id: string;
  name: string;
  address: string | null;
}

interface CheckinResult {
  queue_number: number;
  salon_name: string;
  estimated_duration: number;
}

export default function CustomerCheckin() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Haircut");
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [queueAhead, setQueueAhead] = useState(0);

  // Fetch salon details
  useEffect(() => {
    const fetchSalon = async () => {
      if (!salonId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("salons")
          .select("id, name, address")
          .eq("id", salonId)
          .single();

        if (error) throw error;
        setSalon(data);

        // Also fetch current queue count
        const { count } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("salon_id", salonId)
          .in("status", ["Waiting", "Serving"]);

        setQueueAhead(count || 0);
      } catch (error) {
        console.error("Error fetching salon:", error);
        toast({
          title: "Salon not found",
          description: "The salon you're looking for doesn't exist.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalon();
  }, [salonId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salonId) return;

    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke("customer-checkin", {
        body: {
          salon_id: salonId,
          customer_name: name.trim(),
          service_type: serviceType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to check in");
      }

      const data = response.data;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCheckinResult(data);
      toast({
        title: "Successfully added to queue!",
        description: `You are number ${data.queue_number} in line.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to check in",
        description: error.message || "Please try again or ask staff for help.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Salon Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This QR code may be invalid or the salon no longer exists.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success screen after check-in
  if (checkinResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">You're in the Queue!</h2>
            <div className="bg-primary/10 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Your Queue Number</p>
              <p className="text-5xl font-bold text-primary">#{checkinResult.queue_number}</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Scissors className="w-4 h-4" />
                {checkinResult.salon_name}
              </p>
              <p className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated service time: ~{checkinResult.estimated_duration} min
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait for your number to be called.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center pt-8">
          <Scissors className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{salon.name}</h1>
          {salon.address && (
            <p className="text-sm text-muted-foreground mt-1">{salon.address}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join the Queue</CardTitle>
            <CardDescription>
              Enter your details to add yourself to the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service Type</Label>
                <Select
                  value={serviceType}
                  onValueChange={(value) => setServiceType(value as ServiceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((service) => (
                      <SelectItem key={service} value={service}>
                        <span className="flex items-center justify-between w-full gap-4">
                          <span>{service}</span>
                          <span className="text-muted-foreground text-xs">
                            ~{SERVICE_DURATIONS[service]} min
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {queueAhead > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span>{queueAhead} {queueAhead === 1 ? "person" : "people"} currently in queue</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!name.trim() || isSubmitting}
              >
                {isSubmitting ? "Adding to queue..." : "Join Queue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
