import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Image as ImageIcon, Info, LayoutDashboard, Scissors, Users } from "lucide-react";
import { ProfileOverview } from "./ProfileOverview";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { GalleryManager } from "./GalleryManager";
import { ServicesManager } from "./ServicesManager";
import { StaffMembersManager } from "./StaffMembersManager";
import type { Salon } from "@/hooks/useSalons";
import { useNavigate } from "react-router-dom";

interface Props { salon: Salon; onUpdate: () => void; }

export function SalonProfileManager({ salon, onUpdate }: Props) {
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Salon Profile</h2>
        <Button variant="outline" size="sm" onClick={() => navigate(`/salon/${salon.id}`)}>
          <ExternalLink className="w-4 h-4 mr-2" /> Preview customer view
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted/80 p-1 rounded-xl">
          <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="info"><Info className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Info</span></TabsTrigger>
          <TabsTrigger value="gallery"><ImageIcon className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Gallery</span></TabsTrigger>
          <TabsTrigger value="services"><Scissors className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Services</span></TabsTrigger>
          <TabsTrigger value="staff"><Users className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Staff</span></TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><ProfileOverview salon={salon} onJumpTab={setTab} /></TabsContent>
        <TabsContent value="info" className="mt-6"><ProfileInfoForm salon={salon} onUpdate={onUpdate} /></TabsContent>
        <TabsContent value="gallery" className="mt-6"><GalleryManager salonId={salon.id} /></TabsContent>
        <TabsContent value="services" className="mt-6"><ServicesManager salonId={salon.id} /></TabsContent>
        <TabsContent value="staff" className="mt-6"><StaffMembersManager salonId={salon.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
