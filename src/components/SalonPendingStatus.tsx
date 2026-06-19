import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";

interface Props {
  salonName: string;
  status: "pending" | "rejected";
  rejectionReason?: string | null;
}

export function SalonPendingStatus({ salonName, status, rejectionReason }: Props) {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Salon Status" backTo="/" />
      <div className="flex items-center justify-center p-4 pt-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${status === "pending" ? "bg-amber-500/10" : "bg-destructive/10"}`}>
                {status === "pending" ? (
                  <Clock className="w-10 h-10 text-amber-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {status === "pending" ? "Pending Review" : "Registration Rejected"}
            </CardTitle>
            <CardDescription className="text-base">
              {status === "pending" ? (
                <>
                  Your salon <span className="font-semibold text-foreground">{salonName}</span> has been
                  submitted and is awaiting admin approval.
                </>
              ) : (
                <>
                  Your salon <span className="font-semibold text-foreground">{salonName}</span> was not
                  approved.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "pending" ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  What happens next?
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Our team reviews your salon details to prevent abuse.</li>
                  <li>You'll be able to access the full dashboard once approved.</li>
                  <li>Until then, your salon is not visible to customers.</li>
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <div className="font-medium mb-1">Reason</div>
                <p className="text-muted-foreground">
                  {rejectionReason || "No reason provided. Please contact support."}
                </p>
              </div>
            )}
            <div className="text-xs text-muted-foreground text-center">
              Signed in as {user?.email}
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
