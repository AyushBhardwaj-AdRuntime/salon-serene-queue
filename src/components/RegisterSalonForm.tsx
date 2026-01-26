import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Store } from "lucide-react";
import { useSalons } from "@/hooks/useSalons";

interface RegisterSalonFormProps {
  onSuccess?: () => void;
}

export function RegisterSalonForm({ onSuccess }: RegisterSalonFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { createSalon } = useSalons();

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const salon = await createSalon(name, address, location?.lat, location?.lng);
      if (salon && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Register Your Salon</CardTitle>
          <CardDescription>
            Set up your salon to start managing customer queues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salon-name">Salon Name *</Label>
              <Input
                id="salon-name"
                placeholder="My Awesome Salon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-address">Address</Label>
              <Input
                id="salon-address"
                placeholder="123 Main Street, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Location (for nearby search)</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting location...
                  </>
                ) : location ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4 text-green-500" />
                    Location captured!
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Use Current Location
                  </>
                )}
              </Button>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating salon...
                </>
              ) : (
                "Register Salon"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
