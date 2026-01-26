import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Salon = Database["public"]["Tables"]["salons"]["Row"];

export type { Salon };

export function useSalons() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [mySalon, setMySalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Showing all salons instead of nearby ones.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  // Fetch all salons
  const fetchSalons = async () => {
    try {
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSalons(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching salons",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's salon
  const fetchMySalon = async (userId: string) => {
    try {
      // First check if user owns a salon
      const { data: ownedSalon, error: ownedError } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();

      if (ownedError) throw ownedError;
      
      if (ownedSalon) {
        setMySalon(ownedSalon);
        return;
      }

      // Check if user is staff at a salon
      const { data: staffRecord, error: staffError } = await supabase
        .from("salon_staff")
        .select("salon_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (staffError) throw staffError;

      if (staffRecord) {
        const { data: salon, error: salonError } = await supabase
          .from("salons")
          .select("*")
          .eq("id", staffRecord.salon_id)
          .single();

        if (salonError) throw salonError;
        setMySalon(salon);
      }
    } catch (error: any) {
      console.error("Error fetching my salon:", error);
    }
  };

  // Create salon
  const createSalon = async (name: string, address: string, latitude?: number, longitude?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to create a salon");

      const { data, error } = await supabase
        .from("salons")
        .insert({
          name: name.trim(),
          address: address.trim(),
          latitude,
          longitude,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Salon created!",
        description: `${name} has been registered successfully.`,
      });

      setMySalon(data);
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating salon",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Get nearby salons sorted by distance
  const getNearbySalons = useCallback((maxDistance: number = 50): (Salon & { distance?: number })[] => {
    if (!userLocation) return salons;

    return salons
      .map(salon => {
        if (salon.latitude && salon.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            salon.latitude,
            salon.longitude
          );
          return { ...salon, distance };
        }
        return { ...salon, distance: undefined };
      })
      .filter(salon => salon.distance === undefined || salon.distance <= maxDistance)
      .sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
  }, [salons, userLocation]);

  useEffect(() => {
    fetchSalons();
    getUserLocation();

    const channel = supabase
      .channel("salons-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salons",
        },
        () => {
          fetchSalons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    salons,
    mySalon,
    isLoading,
    userLocation,
    createSalon,
    fetchMySalon,
    getNearbySalons,
    getUserLocation,
  };
}
