import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLoyalty, LoyaltyMember, POINTS_PER_SERVICE } from "@/hooks/useLoyalty";
import { Gift, Users, Star, Trophy, Plus, Search, History, Award } from "lucide-react";
import { format } from "date-fns";

interface LoyaltyManagementProps {
  salonId: string;
}

export function LoyaltyManagement({ salonId }: LoyaltyManagementProps) {
  const {
    members,
    rewards,
    isLoading,
    createReward,
    updateReward,
    deleteReward,
    awardPoints,
    redeemReward,
    lookupMember,
    getVisitHistory,
    getRedemptionHistory,
  } = useLoyalty(salonId);

  const [searchPhone, setSearchPhone] = useState("");
  const [foundMember, setFoundMember] = useState<LoyaltyMember | null>(null);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [memberRedemptions, setMemberRedemptions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // New reward form
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState("");
  const [newRewardDesc, setNewRewardDesc] = useState("");
  const [showNewRewardDialog, setShowNewRewardDialog] = useState(false);

  // Award points dialog
  const [selectedMemberForPoints, setSelectedMemberForPoints] = useState<LoyaltyMember | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");

  const handleSearch = async () => {
    if (!searchPhone.trim()) return;
    setIsSearching(true);
    const member = await lookupMember(searchPhone.trim());
    setFoundMember(member);
    if (member) {
      const history = await getVisitHistory(member.id);
      const redemptions = await getRedemptionHistory(member.id);
      setMemberHistory(history);
      setMemberRedemptions(redemptions);
    }
    setIsSearching(false);
  };

  const handleCreateReward = async () => {
    if (!newRewardName || !newRewardPoints) return;
    await createReward(newRewardName, parseInt(newRewardPoints), newRewardDesc || undefined);
    setNewRewardName("");
    setNewRewardPoints("");
    setNewRewardDesc("");
    setShowNewRewardDialog(false);
  };

  const handleAwardPoints = async () => {
    if (!selectedMemberForPoints || !selectedService) return;
    await awardPoints(selectedMemberForPoints.id, selectedService);
    setSelectedMemberForPoints(null);
    setSelectedService("");
    // Refresh if viewing same member
    if (foundMember?.id === selectedMemberForPoints.id) {
      handleSearch();
    }
  };

  const handleRedeemReward = async (memberId: string, rewardId: string) => {
    await redeemReward(memberId, rewardId);
    // Refresh member data
    if (foundMember?.id === memberId) {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-muted-foreground mt-2">Loading loyalty program...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Loyalty Program</h2>
          <p className="text-muted-foreground">Manage rewards and member points</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users className="w-4 h-4 mr-2" />
          {members.length} Members
        </Badge>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Lookup
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Members</CardTitle>
              <CardDescription>Members sorted by total points</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No loyalty members yet. Members are enrolled when they provide their phone number.
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index < 3 ? (
                              <Trophy className={`w-5 h-5 ${
                                index === 0 ? "text-yellow-500" : 
                                index === 1 ? "text-gray-400" : 
                                "text-amber-600"
                              }`} />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{member.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{member.phone_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-primary">
                            <Star className="w-4 h-4 fill-primary" />
                            {member.total_points}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.total_visits} visits
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMemberForPoints(member)}
                            >
                              <Award className="w-4 h-4 mr-1" />
                              Award
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Award Points to {member.customer_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(POINTS_PER_SERVICE).map(([service, points]) => (
                                  <Button
                                    key={service}
                                    variant={selectedService === service ? "default" : "outline"}
                                    className="justify-between"
                                    onClick={() => setSelectedService(service)}
                                  >
                                    <span>{service}</span>
                                    <Badge variant="secondary">+{points}</Badge>
                                  </Button>
                                ))}
                              </div>
                              <Button
                                className="w-full"
                                disabled={!selectedService}
                                onClick={handleAwardPoints}
                              >
                                Award Points
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewRewardDialog} onOpenChange={setShowNewRewardDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Reward
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reward</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Reward Name</Label>
                    <Input
                      placeholder="e.g., Free Haircut"
                      value={newRewardName}
                      onChange={(e) => setNewRewardName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points Required</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newRewardPoints}
                      onChange={(e) => setNewRewardPoints(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="Describe the reward..."
                      value={newRewardDesc}
                      onChange={(e) => setNewRewardDesc(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newRewardName || !newRewardPoints}
                    onClick={handleCreateReward}
                  >
                    Create Reward
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rewards created yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Create rewards that customers can redeem with their points.
                  </p>
                </CardContent>
              </Card>
            ) : (
              rewards.map((reward) => (
                <Card key={reward.id} className={!reward.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <Badge variant={reward.is_active ? "default" : "secondary"}>
                        {reward.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {reward.description && (
                      <CardDescription>{reward.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                        <Star className="w-5 h-5 fill-primary" />
                        {reward.points_required}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateReward(reward.id, { is_active: !reward.is_active })}
                        >
                          {reward.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReward(reward.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Lookup Tab */}
        <TabsContent value="lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Lookup</CardTitle>
              <CardDescription>Search by phone number to view member details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter phone number..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {foundMember && (
                <div className="space-y-4 mt-6">
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{foundMember.customer_name}</h3>
                        <p className="text-sm text-muted-foreground">{foundMember.phone_number}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-3xl font-bold text-primary">
                          <Star className="w-6 h-6 fill-primary" />
                          {foundMember.total_points}
                        </div>
                        <p className="text-sm text-muted-foreground">available points</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 rounded bg-background">
                        <p className="text-2xl font-bold">{foundMember.total_visits}</p>
                        <p className="text-xs text-muted-foreground">Total Visits</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="text-2xl font-bold">{foundMember.lifetime_points}</p>
                        <p className="text-xs text-muted-foreground">Lifetime Points</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="text-2xl font-bold">
                          {format(new Date(foundMember.created_at), "MMM yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                      </div>
                    </div>
                  </div>

                  {/* Available Rewards to Redeem */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Available Rewards
                    </h4>
                    <div className="grid gap-2">
                      {rewards.filter(r => r.is_active).map((reward) => (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-3 rounded border"
                        >
                          <div>
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {reward.points_required} points
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={foundMember.total_points < reward.points_required}
                            onClick={() => handleRedeemReward(foundMember.id, reward.id)}
                          >
                            Redeem
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visit History */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Recent Visits
                    </h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {memberHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No visit history yet
                          </p>
                        ) : (
                          memberHistory.slice(0, 10).map((visit) => (
                            <div
                              key={visit.id}
                              className="flex items-center justify-between p-2 rounded border text-sm"
                            >
                              <div>
                                <p className="font-medium">{visit.service_type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(visit.visit_date), "PPp")}
                                </p>
                              </div>
                              <Badge variant="secondary">+{visit.points_earned}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {searchPhone && !foundMember && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No member found with this phone number.</p>
                  <p className="text-sm">Members are enrolled when they check in with their phone number.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
