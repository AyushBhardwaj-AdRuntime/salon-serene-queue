import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceType } from "@/hooks/useCustomers";
import { SERVICE_DURATIONS } from "@/hooks/useCustomers";

interface AddCustomerFormProps {
  onAddCustomer: (name: string, serviceType: ServiceType) => Promise<void>;
}

const SERVICE_TYPES: ServiceType[] = [
  "Haircut",
  "Shave",
  "Facial",
  "Hair Color",
  "Beard Trim",
  "Full Package",
];

export function AddCustomerForm({ onAddCustomer }: AddCustomerFormProps) {
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Haircut");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await onAddCustomer(name, serviceType);
    setName("");
    setIsSubmitting(false);
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-serif flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Add to Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Customer Name
            </Label>
            <Input
              id="name"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-medium">
              Service Type
            </Label>
            <Select
              value={serviceType}
              onValueChange={(value) => setServiceType(value as ServiceType)}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((service) => (
                  <SelectItem key={service} value={service}>
                    <span className="flex items-center justify-between w-full gap-4">
                      <span>{service}</span>
                      <span className="text-muted-foreground text-xs">
                        ~{SERVICE_DURATIONS[service]} min
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add to Queue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
