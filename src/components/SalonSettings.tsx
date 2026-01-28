import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Clock, Pause, Play, Settings } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SalonSettingsProps {
  salon: {
    id: string;
    name: string;
    is_open?: boolean;
    is_queue_paused?: boolean;
    opening_time?: string;
    closing_time?: string;
    priority_mode?: string;
  };
  onUpdate: () => void;
}

export function SalonSettings({ salon, onUpdate }: SalonSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(salon.is_open ?? true);
  const [isPaused, setIsPaused] = useState(salon.is_queue_paused ?? false);
  const [openingTime, setOpeningTime] = useState(salon.opening_time ?? "09:00");
  const [closingTime, setClosingTime] = useState(salon.closing_time ?? "18:00");
  const [priorityMode, setPriorityMode] = useState(salon.priority_mode ?? "fifo");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleOpen = async (open: boolean) => {
    setIsOpen(open);
    await updateSalon({ is_open: open });
  };

  const handleTogglePause = async (paused: boolean) => {
    setIsPaused(paused);
    await updateSalon({ is_queue_paused: paused });
  };

  const updateSalon = async (updates: Record<string, any>) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("salons")
        .update(updates)
        .eq("id", salon.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Salon settings have been saved.",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHours = async () => {
    await updateSalon({
      opening_time: openingTime,
      closing_time: closingTime,
      priority_mode: priorityMode,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Salon Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Open/Closed Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="is-open">Salon Status</Label>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isOpen ? "default" : "destructive"}
              className={isOpen ? "bg-[hsl(var(--status-open))]" : "bg-[hsl(var(--status-closed))]"}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
            <Switch
              id="is-open"
              checked={isOpen}
              onCheckedChange={handleToggleOpen}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Queue Pause Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPaused ? (
              <Pause className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Play className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="is-paused">Queue Status</Label>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPaused ? "secondary" : "default"}>
              {isPaused ? "Paused" : "Active"}
            </Badge>
            <Switch
              id="is-paused"
              checked={isPaused}
              onCheckedChange={handleTogglePause}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Operating Hours
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-28"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-28"
            />
          </div>
        </div>

        {/* Priority Mode */}
        <div className="space-y-2">
          <Label>Queue Priority</Label>
          <Select value={priorityMode} onValueChange={setPriorityMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fifo">First In, First Out (FIFO)</SelectItem>
              <SelectItem value="appointment_first">Appointments First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSaveHours} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
