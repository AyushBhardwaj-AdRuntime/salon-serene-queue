import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, Clock, MoreVertical, Check, X, User } from "lucide-react";
import { format } from "date-fns";
import type { Appointment, AppointmentStatus } from "@/hooks/useAppointments";

interface AppointmentListProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  showActions?: boolean;
}

export function AppointmentList({ 
  appointments, 
  onUpdateStatus, 
  onCancel,
  showActions = true 
}: AppointmentListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-[hsl(var(--status-serving))]">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="outline">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed"
  );

  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show"
  );

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No appointments scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Appointments
              <Badge variant="secondary" className="ml-auto">
                {upcomingAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{apt.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service_type} • ~{apt.estimated_duration_minutes} min
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(apt.appointment_time), "PPP")}
                      <Clock className="w-3 h-3 ml-2" />
                      {format(new Date(apt.appointment_time), "p")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(apt.status)}
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, "confirmed")}>
                          <Check className="w-4 h-4 mr-2" />
                          Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, "completed")}>
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(apt.id, "no_show")}>
                          <X className="w-4 h-4 mr-2" />
                          No Show
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onCancel(apt.id)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Past Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastAppointments.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-2 rounded-lg opacity-60"
              >
                <div>
                  <p className="font-medium text-sm">{apt.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {apt.service_type} • {format(new Date(apt.appointment_time), "PPp")}
                  </p>
                </div>
                {getStatusBadge(apt.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
