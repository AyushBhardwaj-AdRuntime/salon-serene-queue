import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegisterSalonFormProps {
  onSuccess?: () => void;
  initialSalon?: any; // when present, acts as Edit & Resubmit form
}

export function RegisterSalonForm({ onSuccess, initialSalon }: RegisterSalonFormProps) {
  const isEdit = !!initialSalon;
  const [name, setName] = useState(initialSalon?.name ?? "");
  const [address, setAddress] = useState(initialSalon?.address ?? "");
  const [phone, setPhone] = useState(initialSalon?.owner_phone ?? "");
  const [proof, setProof] = useState(initialSalon?.business_proof ?? "");
  const [services, setServices] = useState<string>(
    (initialSalon?.services_offered ?? []).join(", ")
  );
  const [openingTime, setOpeningTime] = useState<string>(initialSalon?.opening_time ?? "09:00");
  const [closingTime, setClosingTime] = useState<string>(initialSalon?.closing_time ?? "20:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialSalon?.latitude && initialSalon?.longitude
      ? { lat: initialSalon.latitude, lng: initialSalon.longitude }
      : null
  );
  const { toast } = useToast();

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setIsGettingLocation(false); },
      () => { setIsGettingLocation(false); toast({ title: "Couldn't get location", variant: "destructive" }); }
    );
  };

  const validate = () => {
    if (!name.trim() || name.trim().length > 100) return "Salon name is required (max 100 chars).";
    if (!address.trim()) return "Address is required.";
    if (!phone.trim() || !/^[+\d\s\-()]{7,20}$/.test(phone.trim())) return "Enter a valid phone number.";
    if (!proof.trim() || proof.trim().length > 300) return "Provide a business proof (license, Instagram, or website).";
    const list = services.split(",").map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return "List at least one service (comma separated).";
    if (!openingTime || !closingTime) return "Opening and closing times are required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast({ title: "Check your inputs", description: err, variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const payload: any = {
        name: name.trim(),
        address: address.trim(),
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        owner_phone: phone.trim(),
        business_proof: proof.trim(),
        services_offered: services.split(",").map(s => s.trim()).filter(Boolean),
        opening_time: openingTime,
        closing_time: closingTime,
      };

      if (isEdit) {
        const { error } = await supabase.from("salons").update(payload).eq("id", initialSalon.id);
        if (error) throw error;
        toast({ title: "Salon updated" });
      } else {
        payload.owner_id = user.id;
        payload.approval_status = "approved";
        const { error } = await supabase.from("salons").insert(payload);
        if (error) throw error;
        toast({ title: "Salon registered", description: "You're all set." });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({ title: isEdit ? "Update failed" : "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{isEdit ? "Edit & Resubmit Salon" : "Register Your Salon"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your details and resubmit for admin review."
              : "Fill in your salon details. An admin will review before it goes live."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salon-name">Salon Name *</Label>
              <Input id="salon-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-address">Address *</Label>
              <Input id="salon-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-phone">Owner Phone *</Label>
              <Input id="salon-phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-proof">Business Proof *</Label>
              <Input id="salon-proof" placeholder="License #, Instagram handle, or website URL" value={proof} onChange={(e) => setProof(e.target.value)} maxLength={300} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-services">Services Offered * (comma separated)</Label>
              <Textarea id="salon-services" placeholder="Haircut, Beard trim, Hair color, Facial" value={services} onChange={(e) => setServices(e.target.value)} rows={2} disabled={isSubmitting} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="opening">Opening *</Label>
                <Input id="opening" type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} disabled={isSubmitting} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Closing *</Label>
                <Input id="closing" type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} disabled={isSubmitting} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location <span className="text-xs text-muted-foreground font-normal">(optional, helps customers find you)</span></Label>
              <Button type="button" variant="outline" className="w-full" onClick={handleGetLocation} disabled={isGettingLocation}>
                {isGettingLocation ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting location...</>)
                  : location ? (<><MapPin className="mr-2 h-4 w-4 text-green-500" />Location captured ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})</>)
                  : (<><MapPin className="mr-2 h-4 w-4" />Use Current Location</>)}
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Resubmitting..." : "Submitting..."}</>)
                : (isEdit ? "Resubmit for Review" : "Submit for Review")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
