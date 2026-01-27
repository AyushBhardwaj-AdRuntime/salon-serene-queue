import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ExternalLink } from "lucide-react";

interface DisplayLinksProps {
  salonId: string;
}

export function DisplayLinks({ salonId }: DisplayLinksProps) {
  const baseUrl = window.location.origin;
  const displayUrl = `${baseUrl}/display/${salonId}`;

  const openDisplay = () => {
    window.open(displayUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          Waiting Room Display
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Open this on a TV or monitor in your waiting area to show the live queue.
        </p>
        <Button onClick={openDisplay} className="w-full">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Display
        </Button>
      </CardContent>
    </Card>
  );
}
