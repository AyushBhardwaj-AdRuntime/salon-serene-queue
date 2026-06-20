import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, CheckCircle2, Clock, Star, TrendingUp, Users, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Salon } from "@/hooks/useSalons";
import { useServices, useStaffMembers, useSalonMedia } from "@/hooks/useSalonProfile";

interface Props { salon: Salon; onJumpTab: (t: string) => void; }

interface Stats {
  totalServed: number;
  queueLength: number;
  todaysAppointments: number;
  avgWait: number;
  popularService: string | null;
}

export function ProfileOverview({ salon, onJumpTab }: Props) {
  const { services } = useServices(salon.id);
  const { staff } = useStaffMembers(salon.id);
  const { media } = useSalonMedia(salon.id);
  const [stats, setStats] = useState<Stats>({ totalServed: 0, queueLength: 0, todaysAppointments: 0, avgWait: 0, popularService: null });

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    const load = async () => {
      const [agg, popular, queue, appts] = await Promise.all([
        supabase.from("analytics_daily").select("total_customers, avg_wait_time_minutes").eq("salon_id", salon.id),
        supabase.from("service_analytics").select("service_type, total_count").eq("salon_id", salon.id).order("total_count", { ascending: false }).limit(1),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).in("status", ["Waiting", "Serving"]).eq("request_status", "approved"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).gte("appointment_time", `${today}T00:00:00`).lte("appointment_time", `${today}T23:59:59`),
      ]);

      if (cancelled) return;
      const totalServed = (agg.data || []).reduce((acc, r: any) => acc + (r.total_customers || 0), 0);
      const waitRows = (agg.data || []).filter((r: any) => r.avg_wait_time_minutes);
      const avgWait = waitRows.length ? Math.round(waitRows.reduce((a, r: any) => a + r.avg_wait_time_minutes, 0) / waitRows.length) : 0;
      const popularService = popular.data?.[0]?.service_type ?? null;

      setStats({
        totalServed,
        queueLength: queue.count ?? 0,
        todaysAppointments: appts.count ?? 0,
        avgWait,
        popularService,
      });
    };
    load();
    return () => { cancelled = true; };
  }, [salon.id]);

  const checks = [
    { key: "info", label: "Basic info (name, address, contact)", done: !!salon.name && !!salon.address && !!((salon as any).contact_number), tab: "info" },
    { key: "description", label: "About description", done: !!((salon as any).description), tab: "info" },
    { key: "logo", label: "Salon logo", done: !!((salon as any).logo_url), tab: "info" },
    { key: "hours", label: "Opening hours", done: !!salon.opening_time && !!salon.closing_time, tab: "info" },
    { key: "gallery", label: "At least 3 gallery photos", done: media.filter((m) => m.kind !== "logo").length >= 3, tab: "gallery" },
    { key: "services", label: "At least 1 service", done: services.length > 0, tab: "services" },
    { key: "staff", label: "At least 1 staff member", done: staff.length > 0, tab: "staff" },
    { key: "featured", label: "Featured staff (Most Requested)", done: staff.some((s) => s.is_featured), tab: "staff" },
  ];
  const completion = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Profile Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{completion}%</div>
            <Progress value={completion} className="flex-1" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {checks.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => onJumpTab(c.tab)}
                className="flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted transition text-sm"
              >
                {c.done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Served" value={stats.totalServed} />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Current Queue" value={stats.queueLength} />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Today's Appointments" value={stats.todaysAppointments} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Avg Wait (min)" value={stats.avgWait} />
        <StatCard icon={<Star className="w-5 h-5" />} label="Popular Service" value={stats.popularService ?? "—"} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
        <div className="mt-2 text-2xl font-bold truncate">{value}</div>
      </CardContent>
    </Card>
  );
}
