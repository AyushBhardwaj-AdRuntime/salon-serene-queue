import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/hooks/useCustomers";
import { SERVICE_DURATIONS } from "@/hooks/useCustomers";

const SERVICE_TYPES: ServiceType[] = [
  "Haircut",
  "Shave",
  "Facial",
  "Hair Color",
  "Beard Trim",
  "Full Package",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

interface AppointmentFormProps {
  onSubmit: (
    customerName: string,
    serviceType: ServiceType,
    appointmentTime: Date,
    phoneNumber?: string
  ) => Promise<any>;
  salonName?: string;
}

export function AppointmentForm({ onSubmit, salonName }: AppointmentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("Haircut");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !time) return;

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentTime = new Date(date);
    appointmentTime.setHours(hours, minutes, 0, 0);

    setIsSubmitting(true);
    const result = await onSubmit(name.trim(), serviceType, appointmentTime, phone.trim() || undefined);
    setIsSubmitting(false);

    if (result) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 bg-[hsl(var(--status-serving))]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-[hsl(var(--status-serving))]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Appointment Booked!</h3>
          <p className="text-muted-foreground">
            {format(date!, "PPP")} at {time}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            We'll see you then!
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSuccess(false);
              setName("");
              setPhone("");
              setDate(undefined);
              setTime("");
            }}
          >
            Book Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Book Appointment
        </CardTitle>
        {salonName && (
          <CardDescription>Schedule a visit at {salonName}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="For appointment reminders"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label>Service *</Label>
            <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service} (~{SERVICE_DURATIONS[service]} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {slot}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || !date || !time || isSubmitting}
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
