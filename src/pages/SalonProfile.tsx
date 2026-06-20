import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, Globe, Instagram, MapPin, Phone, Scissors, Star, User, Users } from "lucide-react";
import { RatingDisplay } from "@/components/RatingDisplay";
import type { Salon } from "@/hooks/useSalons";
import type { Service, StaffMember, SalonMedia } from "@/hooks/useSalonProfile";

const SalonProfile = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [media, setMedia] = useState<SalonMedia[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [queueCount, setQueueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    let mounted = true;
    const load = async () => {
      const [salonRes, svcRes, staffRes, mediaRes, avgRes, countRes, queueRes] = await Promise.all([
        supabase.from("salons").select("*").eq("id", salonId).maybeSingle(),
        supabase.from("services").select("*").eq("salon_id", salonId).eq("is_active", true).order("sort_order"),
        supabase.from("staff_members").select("*").eq("salon_id", salonId).order("is_featured", { ascending: false }).order("sort_order"),
        supabase.from("salon_media").select("*").eq("salon_id", salonId).order("kind").order("sort_order"),
        supabase.rpc("get_salon_avg_rating", { salon_uuid: salonId }),
        supabase.rpc("get_salon_rating_count", { salon_uuid: salonId }),
        supabase.rpc("get_public_queue", { _salon_ids: [salonId] }),
      ]);
      if (!mounted) return;
      setSalon(salonRes.data as Salon);
      setServices((svcRes.data as Service[]) || []);
      setStaff((staffRes.data as StaffMember[]) || []);
      setMedia((mediaRes.data as SalonMedia[]) || []);
      setRating({ avg: Number(avgRes.data ?? 0), count: Number(countRes.data ?? 0) });
      setQueueCount((queueRes.data || []).filter((c: any) => c.status === "Waiting").length);
      setIsLoading(false);
    };
    load();

    // SEO
    return () => { mounted = false; };
  }, [salonId]);

  useEffect(() => {
    if (!salon) return;
    document.title = `${salon.name} | SalonQ`;
    const desc = ((salon as any).description || `Book ${salon.name} — view services, staff and live queue.`).slice(0, 155);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", desc);
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = window.location.href;
  }, [salon]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Scissors className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }
  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Salon not found.</p>
        <Button onClick={() => navigate("/salons")}>Browse salons</Button>
      </div>
    );
  }

  const logo = (salon as any).logo_url as string | null;
  const description = (salon as any).description as string | null;
  const contact = (salon as any).contact_number as string | null;
  const instagram = (salon as any).instagram_url as string | null;
  const website = (salon as any).website_url as string | null;
  const mapsUrl = (salon as any).google_maps_url as string | null
    || (salon.latitude && salon.longitude ? `https://maps.google.com/?q=${salon.latitude},${salon.longitude}` : null);
  const isOpen = salon.is_open ?? true;
  const gallery = media.filter((m) => m.kind !== "logo");
  const featured = staff.find((s) => s.is_featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: salon.name,
    image: logo || gallery[0]?.url,
    address: salon.address,
    telephone: contact,
    aggregateRating: rating.count > 0 ? { "@type": "AggregateRating", ratingValue: rating.avg, reviewCount: rating.count } : undefined,
    openingHours: salon.opening_time && salon.closing_time ? `Mo-Su ${salon.opening_time}-${salon.closing_time}` : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">←</Button>
          <button type="button" onClick={() => navigate("/")} className="p-2 rounded-xl bg-primary/10" aria-label="Home">
            <Scissors className="w-5 h-5 text-primary" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{salon.name}</h1>
          </div>
          <Button size="sm" onClick={() => navigate(`/checkin/${salon.id}`)}><Users className="w-4 h-4 mr-2" />Join Queue</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero */}
        <section className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
          <div className="w-40 h-40 mx-auto md:mx-0 rounded-2xl overflow-hidden border bg-muted flex items-center justify-center">
            {logo ? <img src={logo} alt={`${salon.name} logo`} className="w-full h-full object-cover" /> : <Scissors className="w-12 h-12 text-muted-foreground" />}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-bold">{salon.name}</h2>
              <Badge className={isOpen ? "bg-[hsl(var(--status-open,142_71%_45%))]" : "bg-[hsl(var(--status-closed,0_72%_51%))]"}>
                {isOpen ? "Open Now" : "Closed"}
              </Badge>
              {rating.count > 0 && <RatingDisplay rating={rating.avg} count={rating.count} />}
            </div>
            {description && <p className="text-muted-foreground">{description}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {salon.address && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{salon.address}</span>}
              {salon.opening_time && salon.closing_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{salon.opening_time}–{salon.closing_time}</span>}
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{queueCount} in queue</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {contact && <Button asChild variant="outline" size="sm"><a href={`tel:${contact}`}><Phone className="w-4 h-4 mr-2" />Call</a></Button>}
              {mapsUrl && <Button asChild variant="outline" size="sm"><a href={mapsUrl} target="_blank" rel="noreferrer"><MapPin className="w-4 h-4 mr-2" />Directions</a></Button>}
              {instagram && <Button asChild variant="outline" size="sm"><a href={instagram} target="_blank" rel="noreferrer"><Instagram className="w-4 h-4 mr-2" />Instagram</a></Button>}
              {website && <Button asChild variant="outline" size="sm"><a href={website} target="_blank" rel="noreferrer"><Globe className="w-4 h-4 mr-2" />Website</a></Button>}
              <Button size="sm" onClick={() => navigate(`/book/${salon.id}`)}><Calendar className="w-4 h-4 mr-2" />Book Appointment</Button>
            </div>
          </div>
        </section>

        {/* Featured staff */}
        {featured && (
          <section>
            <Card className="border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-amber-500">
                  {featured.photo_url ? <img src={featured.photo_url} alt={featured.name} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <Badge className="bg-amber-500 hover:bg-amber-500 mb-1"><Star className="w-3 h-3 mr-1 fill-current" />Most Requested</Badge>
                  <h3 className="font-semibold text-lg">{featured.name}</h3>
                  <p className="text-sm text-muted-foreground">{featured.role}{featured.experience_years ? ` · ${featured.experience_years} yrs exp` : ""}</p>
                  {featured.specialization && <p className="text-xs text-muted-foreground">{featured.specialization}</p>}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-3">Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((m) => (
                <div key={m.id} className="rounded-lg overflow-hidden border bg-muted">
                  <img src={m.url} alt={m.caption ?? salon.name} className="w-full h-40 object-cover hover:scale-105 transition" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Services</h3>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Services coming soon.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">{s.name}{s.category && <Badge variant="outline">{s.category}</Badge>}</div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes} min</p>
                    </div>
                    <div className="text-lg font-bold text-primary">₹{(s.price_cents / 100).toFixed(0)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Staff */}
        {staff.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold mb-3">Our Team</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staff.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {s.photo_url ? <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{s.name}</span>
                        {s.is_featured && <Badge className="bg-amber-500 hover:bg-amber-500"><Star className="w-3 h-3 mr-1 fill-current" />Top</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{s.role}{s.experience_years ? ` · ${s.experience_years} yrs` : ""}</p>
                      {s.specialization && <p className="text-xs text-muted-foreground">{s.specialization}</p>}
                      {s.bio && <p className="text-xs mt-1 line-clamp-3">{s.bio}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="text-center py-6">
          <p className="text-muted-foreground mb-3">Ready to visit {salon.name}?</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Button onClick={() => navigate(`/checkin/${salon.id}`)}><Users className="w-4 h-4 mr-2" />Join Queue</Button>
            <Button variant="outline" onClick={() => navigate(`/book/${salon.id}`)}><Calendar className="w-4 h-4 mr-2" />Book Appointment</Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SalonProfile;
