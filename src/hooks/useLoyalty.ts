import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LoyaltyMember {
  id: string;
  salon_id: string;
  phone_number: string;
  customer_name: string;
  total_points: number;
  lifetime_points: number;
  total_visits: number;
  created_at: string;
  updated_at: string;
}

export interface VisitHistory {
  id: string;
  loyalty_member_id: string;
  salon_id: string;
  customer_id: string | null;
  service_type: string;
  points_earned: number;
  visit_date: string;
  notes: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  points_required: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  loyalty_member_id: string;
  reward_id: string;
  salon_id: string;
  points_used: number;
  redeemed_at: string;
  status: string;
  reward?: Reward;
}

// Points earned per service type
export const POINTS_PER_SERVICE: Record<string, number> = {
  "Haircut": 30,
  "Shave": 20,
  "Facial": 45,
  "Hair Color": 60,
  "Beard Trim": 15,
  "Full Package": 100,
};

export function useLoyalty(salonId?: string) {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch loyalty members for a salon
  const fetchMembers = async () => {
    if (!salonId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("loyalty_members")
        .select("*")
        .eq("salon_id", salonId)
        .order("total_points", { ascending: false });

      if (error) throw error;
      setMembers((data as LoyaltyMember[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching loyalty members",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch rewards for a salon
  const fetchRewards = async () => {
    if (!salonId) return;

    try {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("salon_id", salonId)
        .order("points_required", { ascending: true });

      if (error) throw error;
      setRewards((data as Reward[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching rewards",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Find or create loyalty member
  const findOrCreateMember = async (
    phoneNumber: string,
    customerName: string
  ): Promise<LoyaltyMember | null> => {
    if (!salonId) return null;

    try {
      // Check if member exists
      const { data: existing, error: fetchError } = await supabase
        .from("loyalty_members")
        .select("*")
        .eq("salon_id", salonId)
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return existing as LoyaltyMember;
      }

      // Create new member
      const { data: newMember, error: insertError } = await supabase
        .from("loyalty_members")
        .insert({
          salon_id: salonId,
          phone_number: phoneNumber,
          customer_name: customerName,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Welcome to our loyalty program!",
        description: `${customerName} has been enrolled.`,
      });

      return newMember as LoyaltyMember;
    } catch (error: any) {
      toast({
        title: "Error with loyalty program",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Award points for a visit
  const awardPoints = async (
    memberId: string,
    serviceType: string,
    customerId?: string,
    notes?: string
  ) => {
    if (!salonId) return;

    const pointsToAward = POINTS_PER_SERVICE[serviceType] || 10;

    try {
      // Create visit history record
      const { error: visitError } = await supabase.from("visit_history").insert({
        loyalty_member_id: memberId,
        salon_id: salonId,
        customer_id: customerId || null,
        service_type: serviceType,
        points_earned: pointsToAward,
        notes: notes || null,
      });

      if (visitError) throw visitError;

      // Update member points
      const { data: member, error: fetchError } = await supabase
        .from("loyalty_members")
        .select("total_points, lifetime_points, total_visits")
        .eq("id", memberId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("loyalty_members")
        .update({
          total_points: (member?.total_points || 0) + pointsToAward,
          lifetime_points: (member?.lifetime_points || 0) + pointsToAward,
          total_visits: (member?.total_visits || 0) + 1,
        })
        .eq("id", memberId);

      if (updateError) throw updateError;

      toast({
        title: "Points awarded!",
        description: `+${pointsToAward} points for ${serviceType}`,
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error awarding points",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get visit history for a member
  const getVisitHistory = async (
    memberId: string
  ): Promise<VisitHistory[]> => {
    try {
      const { data, error } = await supabase
        .from("visit_history")
        .select("*")
        .eq("loyalty_member_id", memberId)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return (data as VisitHistory[]) || [];
    } catch (error: any) {
      toast({
        title: "Error fetching visit history",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  // Get redemption history for a member
  const getRedemptionHistory = async (
    memberId: string
  ): Promise<RewardRedemption[]> => {
    try {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*, reward:rewards(*)")
        .eq("loyalty_member_id", memberId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;
      return (data as RewardRedemption[]) || [];
    } catch (error: any) {
      toast({
        title: "Error fetching redemption history",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  // Redeem a reward
  const redeemReward = async (memberId: string, rewardId: string) => {
    if (!salonId) return false;

    try {
      // Get member and reward details
      const { data: member, error: memberError } = await supabase
        .from("loyalty_members")
        .select("total_points, customer_name")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;

      const { data: reward, error: rewardError } = await supabase
        .from("rewards")
        .select("points_required, name")
        .eq("id", rewardId)
        .single();

      if (rewardError) throw rewardError;

      if ((member?.total_points || 0) < (reward?.points_required || 0)) {
        toast({
          title: "Insufficient points",
          description: `Need ${reward?.points_required} points to redeem this reward.`,
          variant: "destructive",
        });
        return false;
      }

      // Create redemption record
      const { error: redeemError } = await supabase
        .from("reward_redemptions")
        .insert({
          loyalty_member_id: memberId,
          reward_id: rewardId,
          salon_id: salonId,
          points_used: reward?.points_required || 0,
        });

      if (redeemError) throw redeemError;

      // Deduct points
      const { error: updateError } = await supabase
        .from("loyalty_members")
        .update({
          total_points: (member?.total_points || 0) - (reward?.points_required || 0),
        })
        .eq("id", memberId);

      if (updateError) throw updateError;

      toast({
        title: "Reward redeemed!",
        description: `${member?.customer_name} redeemed: ${reward?.name}`,
      });

      fetchMembers();
      return true;
    } catch (error: any) {
      toast({
        title: "Error redeeming reward",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Create a new reward
  const createReward = async (
    name: string,
    pointsRequired: number,
    description?: string
  ) => {
    if (!salonId) return;

    try {
      const { error } = await supabase.from("rewards").insert({
        salon_id: salonId,
        name,
        points_required: pointsRequired,
        description: description || null,
      });

      if (error) throw error;

      toast({
        title: "Reward created",
        description: `${name} is now available for ${pointsRequired} points.`,
      });

      fetchRewards();
    } catch (error: any) {
      toast({
        title: "Error creating reward",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update a reward
  const updateReward = async (
    rewardId: string,
    updates: Partial<Pick<Reward, "name" | "description" | "points_required" | "is_active">>
  ) => {
    try {
      const { error } = await supabase
        .from("rewards")
        .update(updates)
        .eq("id", rewardId);

      if (error) throw error;

      toast({
        title: "Reward updated",
        description: "The reward has been updated successfully.",
      });

      fetchRewards();
    } catch (error: any) {
      toast({
        title: "Error updating reward",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete a reward
  const deleteReward = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from("rewards")
        .delete()
        .eq("id", rewardId);

      if (error) throw error;

      toast({
        title: "Reward deleted",
        description: "The reward has been removed.",
      });

      fetchRewards();
    } catch (error: any) {
      toast({
        title: "Error deleting reward",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Lookup member by phone number
  const lookupMember = async (phoneNumber: string): Promise<LoyaltyMember | null> => {
    if (!salonId) return null;

    try {
      const { data, error } = await supabase
        .from("loyalty_members")
        .select("*")
        .eq("salon_id", salonId)
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (error) throw error;
      return data as LoyaltyMember | null;
    } catch (error: any) {
      return null;
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchMembers();
      fetchRewards();
    }
  }, [salonId]);

  return {
    members,
    rewards,
    isLoading,
    findOrCreateMember,
    awardPoints,
    getVisitHistory,
    getRedemptionHistory,
    redeemReward,
    createReward,
    updateReward,
    deleteReward,
    lookupMember,
    refreshMembers: fetchMembers,
    refreshRewards: fetchRewards,
  };
}
