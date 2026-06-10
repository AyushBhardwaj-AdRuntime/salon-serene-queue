import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentForm } from "@/components/AppointmentForm";
import { RatingForm } from "@/components/RatingForm";
import { useAppointments } from "@/hooks/useAppointments";
import { useRatings } from "@/hooks/useRatings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, ArrowLeft, Calendar, Star } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

interface Salon {
  id: string;
  name: string;
  address: string | null;
}

export default function BookAppointment() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { createAppointment } = useAppointments(salonId);
  const { submitRating } = useRatings(salonId);

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
      } catch (error) {
        console.error("Error fetching salon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalon();
  }, [salonId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scissors className="w-12 h-12 text-primary animate-pulse" />
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
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Book Appointment" subtitle={salon.name} backTo="/salons" />
      <div className="max-w-md mx-auto space-y-6 p-4">
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold">{salon.name}</h1>
          {salon.address && (
            <p className="text-sm text-muted-foreground mt-1">{salon.address}</p>
          )}
        </div>


        <Tabs defaultValue="book">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Book
            </TabsTrigger>
            <TabsTrigger value="rate" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Rate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="mt-4">
            <AppointmentForm
              salonName={salon.name}
              onSubmit={async (name, service, time, phone) => {
                return await createAppointment(name, service, time, phone);
              }}
            />
          </TabsContent>

          <TabsContent value="rate" className="mt-4">
            <RatingForm onSubmit={submitRating} />
          </TabsContent>
        </Tabs>

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
