import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Star, Gift, History, Trophy, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CustomerLoyaltyCardProps {
  salonId: string;
  phoneNumber: string;
  customerName?: string;
}

interface LoyaltyMember {
  id: string;
  total_points: number;
  lifetime_points: number;
  total_visits: number;
  created_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
}

interface VisitRecord {
  id: string;
  service_type: string;
  points_earned: number;
  visit_date: string;
}

export function CustomerLoyaltyCard({ salonId, phoneNumber, customerName }: CustomerLoyaltyCardProps) {
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!phoneNumber || !salonId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch or create member
        const { data: existingMember } = await supabase
          .from("loyalty_members")
          .select("*")
          .eq("salon_id", salonId)
          .eq("phone_number", phoneNumber)
          .maybeSingle();

        if (existingMember) {
          setMember(existingMember as LoyaltyMember);

          // Fetch visit history
          const { data: visitData } = await supabase
            .from("visit_history")
            .select("id, service_type, points_earned, visit_date")
            .eq("loyalty_member_id", existingMember.id)
            .order("visit_date", { ascending: false })
            .limit(10);

          setVisits((visitData as VisitRecord[]) || []);
        }

        // Fetch available rewards
        const { data: rewardData } = await supabase
          .from("rewards")
          .select("id, name, description, points_required")
          .eq("salon_id", salonId)
          .eq("is_active", true)
          .order("points_required", { ascending: true });

        setRewards((rewardData as Reward[]) || []);
      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [salonId, phoneNumber]);

  if (isLoading) {
    return null;
  }

  if (!member) {
    return null;
  }

  // Find next reward
  const nextReward = rewards.find(r => r.points_required > member.total_points);
  const progressToNextReward = nextReward
    ? Math.min((member.total_points / nextReward.points_required) * 100, 100)
    : 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Loyalty Member
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {member.total_visits} visits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Display */}
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-4xl font-bold text-primary">
            <Star className="w-8 h-8 fill-primary" />
            {member.total_points}
          </div>
          <p className="text-sm text-muted-foreground">available points</p>
        </div>

        {/* Progress to Next Reward */}
        {nextReward && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next reward:</span>
              <span className="font-medium">{nextReward.name}</span>
            </div>
            <Progress value={progressToNextReward} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {nextReward.points_required - member.total_points} more points needed
            </p>
          </div>
        )}

        {/* Available Rewards Preview */}
        {rewards.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Redeem your points:</p>
            <div className="space-y-1">
              {rewards.slice(0, 2).map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    member.total_points >= reward.points_required
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    {reward.name}
                  </span>
                  <span className="font-medium">{reward.points_required} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View History Button */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full" size="sm">
              <History className="w-4 h-4 mr-2" />
              View History
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Visit History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{member.total_visits}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{member.lifetime_points}</p>
                  <p className="text-xs text-muted-foreground">Lifetime Points</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recent Visits</p>
                <ScrollArea className="h-[200px]">
                  {visits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No visits recorded yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div>
                            <p className="font-medium text-sm">{visit.service_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(visit.visit_date), "PPp")}
                            </p>
                          </div>
                          <Badge variant="secondary">+{visit.points_earned}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Member since {format(new Date(member.created_at), "MMMM yyyy")}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
