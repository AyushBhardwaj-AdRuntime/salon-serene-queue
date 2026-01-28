import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, Clock, MoreVertical, User } from "lucide-react";
import type { Customer, QueueStatus } from "@/hooks/useCustomers";
import type { Database } from "@/integrations/supabase/types";

type QueueRequestStatus = Database["public"]["Enums"]["queue_request_status"];

interface PendingRequestsProps {
  customers: Customer[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function PendingRequests({ customers, onApprove, onReject }: PendingRequestsProps) {
  const pendingCustomers = customers.filter(
    (c) => (c as any).request_status === "pending"
  );

  if (pendingCustomers.length === 0) {
    return null;
  }

  return (
    <Card className="border-[hsl(var(--status-pending))]/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-[hsl(var(--status-pending))]" />
          Pending Queue Requests
          <Badge variant="secondary" className="ml-auto">
            {pendingCustomers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingCustomers.map((customer) => (
          <div
            key={customer.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{customer.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.service_type} • ~{customer.estimated_duration_minutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onReject(customer.id)}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-[hsl(var(--status-serving))] hover:bg-[hsl(var(--status-serving))]/90"
                onClick={() => onApprove(customer.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
