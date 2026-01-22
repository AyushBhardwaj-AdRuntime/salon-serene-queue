import { Loader2 } from "lucide-react";
import { CustomerCard } from "@/components/CustomerCard";
import type { Customer, QueueStatus } from "@/hooks/useCustomers";

interface QueueListProps {
  customers: Customer[];
  isLoading: boolean;
  getEstimatedWaitTime: (customer: Customer) => number;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
}

export function QueueList({
  customers,
  isLoading,
  getEstimatedWaitTime,
  onUpdateStatus,
  onRemove,
}: QueueListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-serif">No customers in queue</p>
        <p className="text-sm mt-1">Add a customer to get started</p>
      </div>
    );
  }

  // Sort: Serving first, then Waiting, then Done
  const sortedCustomers = [...customers].sort((a, b) => {
    const order: Record<QueueStatus, number> = {
      Serving: 0,
      Waiting: 1,
      Done: 2,
    };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return a.queue_number - b.queue_number;
  });

  return (
    <div className="space-y-3">
      {sortedCustomers.map((customer, index) => (
        <div
          key={customer.id}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CustomerCard
            customer={customer}
            estimatedWait={getEstimatedWaitTime(customer)}
            onUpdateStatus={onUpdateStatus}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  );
}
