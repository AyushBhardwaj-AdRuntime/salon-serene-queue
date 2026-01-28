import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Rating = Database["public"]["Tables"]["ratings"]["Row"];

export type { Rating };

export function useRatings(salonId?: string) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRatings = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRatings(data || []);

      // Calculate average
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setRatingCount(data.length);
      }
    } catch (error: any) {
      console.error("Error fetching ratings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (
    rating: number,
    customerName?: string,
    feedback?: string,
    customerId?: string
  ) => {
    if (!salonId) return false;

    try {
      const { error } = await supabase.from("ratings").insert({
        salon_id: salonId,
        rating,
        customer_name: customerName?.trim() || null,
        feedback: feedback?.trim() || null,
        customer_id: customerId || null,
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error submitting rating",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchRatings();

      const channel = supabase
        .channel(`ratings-${salonId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ratings",
            filter: `salon_id=eq.${salonId}`,
          },
          () => fetchRatings()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [salonId]);

  return {
    ratings,
    avgRating,
    ratingCount,
    isLoading,
    submitRating,
    refetch: fetchRatings,
  };
}

// Hook to fetch ratings for multiple salons
export function useSalonRatings() {
  const [salonRatings, setSalonRatings] = useState<Record<string, { avg: number; count: number }>>({});

  const fetchAllRatings = async (salonIds: string[]) => {
    if (salonIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("salon_id, rating")
        .in("salon_id", salonIds);

      if (error) throw error;

      // Group by salon_id and calculate averages
      const grouped: Record<string, number[]> = {};
      data?.forEach((r) => {
        if (!grouped[r.salon_id]) grouped[r.salon_id] = [];
        grouped[r.salon_id].push(r.rating);
      });

      const result: Record<string, { avg: number; count: number }> = {};
      Object.entries(grouped).forEach(([salonId, ratings]) => {
        result[salonId] = {
          avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
          count: ratings.length,
        };
      });

      setSalonRatings(result);
    } catch (error) {
      console.error("Error fetching salon ratings:", error);
    }
  };

  return { salonRatings, fetchAllRatings };
}
