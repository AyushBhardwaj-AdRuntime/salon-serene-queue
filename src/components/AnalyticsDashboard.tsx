import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { BarChart, TrendingUp, Clock, Users, Scissors } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsDashboardProps {
  salonId: string;
}

export function AnalyticsDashboard({ salonId }: AnalyticsDashboardProps) {
  const { dailyStats, serviceStats, hourlyStats, todayStats, isLoading } = useAnalytics(salonId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Customers</p>
                <p className="text-2xl font-bold">{todayStats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Service Time</p>
                <p className="text-2xl font-bold">{todayStats.avgWaitTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold">
                  {todayStats.peakHour !== null ? formatHour(todayStats.peakHour) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Popular Services (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            serviceStats.map((service) => (
              <div key={service.serviceType} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{service.serviceType}</span>
                  <span className="text-muted-foreground">
                    {service.count} ({service.percentage}%)
                  </span>
                </div>
                <Progress value={service.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Today's Busy Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {hourlyStats.slice(8, 20).map((hour) => {
              const maxCount = Math.max(...hourlyStats.map((h) => h.count), 1);
              const height = (hour.count / maxCount) * 100;
              return (
                <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all"
                    style={{ height: `${height}%`, minHeight: hour.count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-xs text-muted-foreground">{formatHour(hour.hour)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyStats.slice(0, 7).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="font-medium">
                  {new Date(day.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{day.totalCustomers} customers</span>
                  <span>~{day.avgWaitTime} min avg</span>
                  {day.peakHour !== null && <span>Peak: {formatHour(day.peakHour)}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
