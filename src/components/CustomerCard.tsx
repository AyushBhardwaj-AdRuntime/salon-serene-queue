import { useState } from "react";
import { Clock, Scissors, Trash2, ArrowRight, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer, QueueStatus } from "@/hooks/useCustomers";
import { useLoyalty, POINTS_PER_SERVICE } from "@/hooks/useLoyalty";

interface CustomerCardProps {
  customer: Customer;
  estimatedWait: number;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
  salonId?: string;
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
  salonId,
}: CustomerCardProps) {
  const nextStatus = STATUS_FLOW[customer.status];
  const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(customer.phone_number || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const { findOrCreateMember, awardPoints } = useLoyalty(salonId);

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

  const handleStatusChange = async () => {
    if (!nextStatus) return;

    // If marking as Done and we have salonId, show loyalty dialog
    if (nextStatus === "Done" && salonId) {
      setShowLoyaltyDialog(true);
    } else {
      await onUpdateStatus(customer.id, nextStatus);
    }
  };

  const handleCompleteWithPoints = async () => {
    if (!salonId) return;
    setIsProcessing(true);

    try {
      // Award points if phone number is provided
      if (phoneNumber.trim()) {
        const member = await findOrCreateMember(phoneNumber.trim(), customer.customer_name);
        if (member) {
          await awardPoints(member.id, customer.service_type, customer.id);
        }
      }

      // Mark as done
      await onUpdateStatus(customer.id, "Done");
      setShowLoyaltyDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteWithoutPoints = async () => {
    await onUpdateStatus(customer.id, "Done");
    setShowLoyaltyDialog(false);
  };

  const pointsToEarn = POINTS_PER_SERVICE[customer.service_type] || 10;

  return (
    <>
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
                {customer.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone_number}
                  </span>
                )}
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
                  onClick={handleStatusChange}
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

      {/* Loyalty Points Dialog */}
      <Dialog open={showLoyaltyDialog} onOpenChange={setShowLoyaltyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Loyalty Points?</DialogTitle>
            <DialogDescription>
              {customer.customer_name}'s service is complete. Award {pointsToEarn} loyalty points for {customer.service_type}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                <Star className="w-8 h-8 fill-primary" />
                +{pointsToEarn}
              </div>
              <p className="text-sm text-muted-foreground mt-1">points for {customer.service_type}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (for loyalty enrollment)</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {customer.phone_number 
                  ? "Phone number from check-in" 
                  : "Enter phone number to enroll in loyalty program"}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCompleteWithoutPoints}
              disabled={isProcessing}
            >
              Skip Points
            </Button>
            <Button
              onClick={handleCompleteWithPoints}
              disabled={isProcessing || !phoneNumber.trim()}
            >
              {isProcessing ? "Processing..." : `Award ${pointsToEarn} Points`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
