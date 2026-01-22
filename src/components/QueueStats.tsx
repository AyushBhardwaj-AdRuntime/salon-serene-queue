import { Users, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/hooks/useCustomers";

interface QueueStatsProps {
  customers: Customer[];
}

export function QueueStats({ customers }: QueueStatsProps) {
  const waiting = customers.filter((c) => c.status === "Waiting").length;
  const serving = customers.filter((c) => c.status === "Serving").length;
  const done = customers.filter((c) => c.status === "Done").length;

  const stats = [
    {
      label: "Waiting",
      value: waiting,
      icon: Clock,
      className: "text-status-waiting",
    },
    {
      label: "Serving",
      value: serving,
      icon: Loader2,
      className: "text-status-serving",
      iconClass: serving > 0 ? "animate-spin" : "",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle,
      className: "text-status-done",
    },
    {
      label: "Total",
      value: customers.length,
      icon: Users,
      className: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className="glass-card animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <stat.icon
              className={`w-8 h-8 ${stat.className} ${stat.iconClass || ""}`}
            />
            <div>
              <p className="text-2xl font-semibold font-serif">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
