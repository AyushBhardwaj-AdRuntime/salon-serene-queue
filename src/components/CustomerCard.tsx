import { Clock, Scissors, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Customer, QueueStatus } from "@/hooks/useCustomers";

interface CustomerCardProps {
  customer: Customer;
  estimatedWait: number;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
}

const STATUS_FLOW: Record<QueueStatus, QueueStatus | null> = {
  Waiting: "Serving",
  Serving: "Done",
  Done: null,
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  Waiting: "Start Service",
  Serving: "Mark Complete",
  Done: "Completed",
};

export function CustomerCard({
  customer,
  estimatedWait,
  onUpdateStatus,
  onRemove,
}: CustomerCardProps) {
  const nextStatus = STATUS_FLOW[customer.status];

  const getStatusBadgeClass = () => {
    switch (customer.status) {
      case "Waiting":
        return "status-badge-waiting";
      case "Serving":
        return "status-badge-serving animate-pulse-soft";
      case "Done":
        return "status-badge-done";
    }
  };

  return (
    <Card className="glass-card animate-slide-up overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Queue Number */}
          <div className="queue-number shrink-0">
            #{customer.queue_number}
          </div>

          {/* Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate font-serif">
                {customer.customer_name}
              </h3>
              <Badge className={getStatusBadgeClass()}>
                {customer.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                {customer.service_type}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {customer.estimated_duration_minutes} min
              </span>
              {customer.status === "Waiting" && estimatedWait > 0 && (
                <span className="text-primary font-medium">
                  ~{estimatedWait} min wait
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {nextStatus && (
              <Button
                size="sm"
                variant={customer.status === "Waiting" ? "default" : "secondary"}
                onClick={() => onUpdateStatus(customer.id, nextStatus)}
                className="gap-1"
              >
                {STATUS_LABELS[customer.status]}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            {customer.status === "Done" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(customer.id, customer.customer_name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
