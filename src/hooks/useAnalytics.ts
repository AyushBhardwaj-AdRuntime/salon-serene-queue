import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

interface DailyStats {
  date: string;
  totalCustomers: number;
  avgWaitTime: number;
  peakHour: number | null;
}

interface ServiceStats {
  serviceType: ServiceType;
  count: number;
  percentage: number;
}

interface HourlyStats {
  hour: number;
  count: number;
}

export function useAnalytics(salonId?: string) {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [todayStats, setTodayStats] = useState<{
    totalCustomers: number;
    avgWaitTime: number;
    peakHour: number | null;
  }>({ totalCustomers: 0, avgWaitTime: 0, peakHour: null });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Fetch customers from last 7 days for analytics
      const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .eq("salon_id", salonId)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate daily stats
      const dailyMap: Record<string, { count: number; waitTimes: number[]; hours: number[] }> = {};
      customers?.forEach((c) => {
        const date = c.created_at.split("T")[0];
        if (!dailyMap[date]) dailyMap[date] = { count: 0, waitTimes: [], hours: [] };
        dailyMap[date].count++;
        dailyMap[date].waitTimes.push(c.estimated_duration_minutes);
        dailyMap[date].hours.push(new Date(c.created_at).getHours());
      });

      const dailyStatsArray: DailyStats[] = Object.entries(dailyMap).map(([date, data]) => {
        const hourCounts: Record<number, number> = {};
        data.hours.forEach((h) => {
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const peakHour = Object.entries(hourCounts).reduce(
          (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
          { hour: 0, count: 0 }
        );

        return {
          date,
          totalCustomers: data.count,
          avgWaitTime: Math.round(data.waitTimes.reduce((a, b) => a + b, 0) / data.waitTimes.length),
          peakHour: peakHour.count > 0 ? peakHour.hour : null,
        };
      });

      setDailyStats(dailyStatsArray.sort((a, b) => b.date.localeCompare(a.date)));

      // Today's stats
      const todayData = dailyMap[today] || { count: 0, waitTimes: [], hours: [] };
      const todayHourCounts: Record<number, number> = {};
      todayData.hours.forEach((h) => {
        todayHourCounts[h] = (todayHourCounts[h] || 0) + 1;
      });
      const todayPeakHour = Object.entries(todayHourCounts).reduce(
        (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
        { hour: 0, count: 0 }
      );

      setTodayStats({
        totalCustomers: todayData.count,
        avgWaitTime: todayData.waitTimes.length > 0
          ? Math.round(todayData.waitTimes.reduce((a, b) => a + b, 0) / todayData.waitTimes.length)
          : 0,
        peakHour: todayPeakHour.count > 0 ? todayPeakHour.hour : null,
      });

      // Service stats
      const serviceMap: Record<string, number> = {};
      customers?.forEach((c) => {
        serviceMap[c.service_type] = (serviceMap[c.service_type] || 0) + 1;
      });

      const total = customers?.length || 1;
      const serviceStatsArray: ServiceStats[] = Object.entries(serviceMap)
        .map(([serviceType, count]) => ({
          serviceType: serviceType as ServiceType,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setServiceStats(serviceStatsArray);

      // Hourly stats (today)
      const hourlyMap: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourlyMap[i] = 0;
      customers
        ?.filter((c) => c.created_at.startsWith(today))
        .forEach((c) => {
          const hour = new Date(c.created_at).getHours();
          hourlyMap[hour]++;
        });

      setHourlyStats(
        Object.entries(hourlyMap).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }))
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchAnalytics();
    }
  }, [salonId]);

  return {
    dailyStats,
    serviceStats,
    hourlyStats,
    todayStats,
    isLoading,
    refetch: fetchAnalytics,
  };
}
