import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Save, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Salon } from "@/hooks/useSalons";
import { uploadSalonMediaFile } from "@/hooks/useSalonProfile";

interface Props {
  salon: Salon;
  onUpdate: () => void;
}

export function ProfileInfoForm({ salon, onUpdate }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: salon.name ?? "",
    description: (salon as any).description ?? "",
    address: salon.address ?? "",
    contact_number: (salon as any).contact_number ?? (salon as any).owner_phone ?? "",
    instagram_url: (salon as any).instagram_url ?? "",
    website_url: (salon as any).website_url ?? "",
    google_maps_url: (salon as any).google_maps_url ?? "",
    opening_time: salon.opening_time ?? "09:00",
    closing_time: salon.closing_time ?? "20:00",
    logo_url: (salon as any).logo_url ?? "",
  });
  const [isOpen, setIsOpen] = useState(salon.is_open ?? true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    salon.latitude && salon.longitude ? { lat: salon.latitude, lng: salon.longitude } : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const getLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        setIsLocating(false);
        toast({ title: "Location captured" });
      },
      () => {
        setIsLocating(false);
        toast({ title: "Couldn't get location", variant: "destructive" });
      }
    );
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Logo must be an image", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo must be under 2MB", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const { url } = await uploadSalonMediaFile(salon.id, "logo", file);
      update("logo_url", url);
      toast({ title: "Logo uploaded — remember to save" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const validateUrl = (v: string) => !v || /^https?:\/\//i.test(v);

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Salon name is required", variant: "destructive" });
    if (!validateUrl(form.instagram_url) || !validateUrl(form.website_url) || !validateUrl(form.google_maps_url)) {
      return toast({ title: "URLs must start with http(s)://", variant: "destructive" });
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("salons")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          address: form.address.trim(),
          contact_number: form.contact_number.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          website_url: form.website_url.trim() || null,
          google_maps_url: form.google_maps_url.trim() || null,
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          logo_url: form.logo_url || null,
          is_open: isOpen,
          ...(location ? { latitude: location.lat, longitude: location.lng } : {}),
        } as any)
        .eq("id", salon.id);
      if (error) throw error;
      toast({ title: "Salon profile saved" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Salon Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden border flex items-center justify-center">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Salon logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="logo">Salon Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">PNG/JPG, max 2MB</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Salon Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>About Salon</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={500} rows={3}
              placeholder="A short description customers will see on your profile." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label>Contact Number</Label>
            <Input value={form.contact_number} onChange={(e) => update("contact_number", e.target.value)} maxLength={20} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Google Maps URL</Label>
            <Input value={form.google_maps_url} onChange={(e) => update("google_maps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={form.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/yoursalon" />
          </div>
          <div className="space-y-2">
            <Label>Website (optional)</Label>
            <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://yoursalon.com" />
          </div>
          <div className="space-y-2">
            <Label>Opening Time</Label>
            <Input type="time" value={form.opening_time} onChange={(e) => update("opening_time", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Closing Time</Label>
            <Input type="time" value={form.closing_time} onChange={(e) => update("closing_time", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="text-sm">Business Status</Label>
            <p className="text-xs text-muted-foreground">Toggle to show your salon as open or closed</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={isOpen ? "bg-[hsl(var(--status-open,142_71%_45%))]" : "bg-[hsl(var(--status-closed,0_72%_51%))]"}>
              {isOpen ? "Open" : "Closed"}
            </Badge>
            <Switch checked={isOpen} onCheckedChange={setIsOpen} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Map Location</Label>
          <Button type="button" variant="outline" className="w-full" onClick={getLocation} disabled={isLocating}>
            {isLocating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting location…</>
              : location ? <><MapPin className="mr-2 h-4 w-4 text-green-500" />Location set ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})</>
              : <><MapPin className="mr-2 h-4 w-4" />Use Current Location</>}
          </Button>
        </div>

        <Button onClick={save} disabled={isSaving} className="w-full">
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Salon Info</>}
        </Button>
      </CardContent>
    </Card>
  );
}
