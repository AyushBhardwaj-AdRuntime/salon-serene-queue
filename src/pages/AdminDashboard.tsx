import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";
import { Check, X, MapPin, ShieldCheck, Loader2, LogOut } from "lucide-react";

interface SalonRow {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_id: string;
  approval_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin, rolesLoaded, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState("pending");

  // Guard route
  useEffect(() => {
    if (isLoading || !rolesLoaded) return;
    if (!isAuthenticated) {
      navigate("/admin-login", { replace: true });
    } else if (!isAdmin) {
      toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAdmin, rolesLoaded, isLoading, navigate, toast]);

  const fetchSalons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_salons" as any, { _status: null });
    if (error) {
      toast({ title: "Failed to load salons", description: error.message, variant: "destructive" });
    } else {
      setSalons((data as SalonRow[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin && rolesLoaded) fetchSalons();
  }, [isAdmin, rolesLoaded, fetchSalons]);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("salons")
      .update({
        approval_status: "approved",
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Approve failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salon approved" });
      fetchSalons();
    }
  };

  const reject = async (id: string) => {
    if (!reason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("salons")
      .update({
        approval_status: "rejected",
        rejection_reason: reason.trim(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salon rejected" });
      setRejectingId(null);
      setReason("");
      fetchSalons();
    }
  };

  if (isLoading || !rolesLoaded || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = salons.filter((s) => s.approval_status === tab);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Admin Console" backTo="/" />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Salon Review</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="pending">
              Pending ({salons.filter((s) => s.approval_status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No salons in this category.</CardContent></Card>
            ) : (
              filtered.map((s) => (
                <Card key={s.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>{s.name}</CardTitle>
                        <CardDescription>
                          Submitted {new Date(s.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant={s.approval_status === "approved" ? "default" : s.approval_status === "rejected" ? "destructive" : "secondary"}>
                        {s.approval_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {s.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div>{s.address}</div>
                          {s.latitude && s.longitude && (
                            <div className="text-xs text-muted-foreground">
                              {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">Owner ID: {s.owner_id}</div>
                    {s.rejection_reason && (
                      <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                        <span className="font-medium">Reason:</span> {s.rejection_reason}
                      </div>
                    )}

                    {s.approval_status === "pending" && (
                      <div className="pt-2 space-y-2">
                        {rejectingId === s.id ? (
                          <>
                            <Textarea
                              placeholder="Reason for rejection (shown to owner)"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              maxLength={500}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={() => reject(s.id)}>
                                Confirm Reject
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setReason(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approve(s.id)}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejectingId(s.id)}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {s.approval_status !== "pending" && (
                      <Button size="sm" variant="outline" onClick={() => approve(s.id)} disabled={s.approval_status === "approved"}>
                        Re-approve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
