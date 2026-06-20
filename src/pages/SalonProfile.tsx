import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Instagram,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import { RatingDisplay } from "@/components/RatingDisplay";
import type { Salon } from "@/hooks/useSalons";
import type { Service, StaffMember, SalonMedia } from "@/hooks/useSalonProfile";

type Review = {
  id: string;
  rating: number;
  feedback: string | null;
  customer_name: string | null;
  created_at: string;
};

const SalonProfile = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [media, setMedia] = useState<SalonMedia[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!salonId) return;
    let mounted = true;
    const load = async () => {
      const [salonRes, svcRes, staffRes, mediaRes, avgRes, countRes, queueRes, reviewsRes] =
        await Promise.all([
          supabase.from("salons").select("*").eq("id", salonId).maybeSingle(),
          supabase.from("services").select("*").eq("salon_id", salonId).eq("is_active", true).order("sort_order"),
          supabase.from("staff_members").select("*").eq("salon_id", salonId).order("is_featured", { ascending: false }).order("sort_order"),
          supabase.from("salon_media").select("*").eq("salon_id", salonId).order("kind").order("sort_order"),
          supabase.rpc("get_salon_avg_rating", { salon_uuid: salonId }),
          supabase.rpc("get_salon_rating_count", { salon_uuid: salonId }),
          supabase.rpc("get_public_queue", { _salon_ids: [salonId] }),
          supabase
            .from("ratings")
            .select("id,rating,feedback,customer_name,created_at")
            .eq("salon_id", salonId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
      if (!mounted) return;
      setSalon(salonRes.data as Salon);
      setServices((svcRes.data as Service[]) || []);
      setStaff((staffRes.data as StaffMember[]) || []);
      setMedia((mediaRes.data as SalonMedia[]) || []);
      setRating({ avg: Number(avgRes.data ?? 0), count: Number(countRes.data ?? 0) });
      setReviews((reviewsRes.data as Review[]) || []);
      setQueueCount((queueRes.data || []).filter((c: any) => c.status === "Waiting").length);
      setIsLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [salonId]);

  useEffect(() => {
    if (!salon) return;
    document.title = `${salon.name} | SalonQ`;
    const desc = (((salon as any).description as string | null) ||
      `Book ${salon.name} — view services, staff and live queue.`).slice(0, 155);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = window.location.href;
  }, [salon]);

  const avgDuration = useMemo(() => {
    if (!services.length) return 15;
    const sum = services.reduce((s, x) => s + (x.duration_minutes || 0), 0);
    return Math.max(10, Math.round(sum / services.length));
  }, [services]);
  const estWaitMinutes = queueCount * avgDuration;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scissors className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }
  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
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
  const mapsUrl =
    ((salon as any).google_maps_url as string | null) ||
    (salon.latitude && salon.longitude
      ? `https://maps.google.com/?q=${salon.latitude},${salon.longitude}`
      : salon.address
      ? `https://maps.google.com/?q=${encodeURIComponent(salon.address)}`
      : null);
  const isOpen = salon.is_open ?? true;
  const gallery = media.filter((m) => m.kind !== "logo");
  const featured = staff.find((s) => s.is_featured);

  const groupedServices = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category || "Services";
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: salon.name,
    image: logo || gallery[0]?.url,
    address: salon.address,
    telephone: contact,
    aggregateRating:
      rating.count > 0
        ? { "@type": "AggregateRating", ratingValue: rating.avg, reviewCount: rating.count }
        : undefined,
    openingHours:
      salon.opening_time && salon.closing_time
        ? `Mo-Su ${salon.opening_time}-${salon.closing_time}`
        : undefined,
  };

  const fmtWait = (m: number) =>
    m <= 0 ? "No wait" : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-semibold truncate">{salon.name}</h1>
          </div>
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate(`/checkin/${salon.id}`)}
          >
            <Users className="w-4 h-4 mr-2" />
            Join Queue
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 md:py-8 space-y-8 max-w-5xl">
        {/* HERO */}
        <section className="animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-5 md:p-8 shadow-xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row gap-5 md:gap-7">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-background shadow-lg bg-muted flex items-center justify-center shrink-0">
                {logo ? (
                  <img src={logo} alt={`${salon.name} logo`} className="w-full h-full object-cover" />
                ) : (
                  <Scissors className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-3 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{salon.name}</h2>
                  <Badge
                    className={
                      isOpen
                        ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                        : "bg-destructive hover:bg-destructive text-destructive-foreground"
                    }
                  >
                    <span className="relative flex w-2 h-2 mr-1.5">
                      {isOpen && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    {isOpen ? "Open Now" : "Closed"}
                  </Badge>
                </div>

                {rating.count > 0 && (
                  <div className="flex justify-center md:justify-start">
                    <RatingDisplay rating={rating.avg} count={rating.count} />
                  </div>
                )}

                {description && (
                  <p className="text-sm md:text-base text-muted-foreground line-clamp-3">{description}</p>
                )}

                {salon.address && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">{salon.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="relative grid grid-cols-3 gap-2 md:gap-3 mt-5 md:mt-7">
              <StatTile icon={<Users className="w-4 h-4" />} label="In Queue" value={String(queueCount)} />
              <StatTile icon={<Clock className="w-4 h-4" />} label="Est. Wait" value={fmtWait(estWaitMinutes)} />
              <StatTile
                icon={<Sparkles className="w-4 h-4" />}
                label="Today"
                value={salon.opening_time && salon.closing_time ? `${salon.opening_time}–${salon.closing_time}` : "—"}
              />
            </div>

            {/* Actions */}
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
              <Button size="lg" className="shadow-md" onClick={() => navigate(`/checkin/${salon.id}`)}>
                <Users className="w-4 h-4 mr-2" />
                Join Queue
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate(`/book/${salon.id}`)}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                disabled={!mapsUrl}
              >
                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                ) : (
                  <span><MapPin className="w-4 h-4 mr-2" />Get Directions</span>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* GALLERY */}
        {gallery.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader title="Gallery" subtitle={`${gallery.length} photo${gallery.length === 1 ? "" : "s"}`} />
            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:mx-0 md:px-0 md:overflow-visible">
              {gallery.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLightbox(m.url)}
                  className="snap-start shrink-0 w-64 md:w-auto rounded-2xl overflow-hidden border border-border/50 bg-muted relative group focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <img
                    src={m.url}
                    alt={m.caption ?? salon.name}
                    loading="lazy"
                    className="w-full h-44 md:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED STAFF */}
        {featured && (
          <section className="animate-fade-in">
            <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-background shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border-2 border-amber-500 shrink-0">
                  {featured.photo_url ? (
                    <img src={featured.photo_url} alt={featured.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="bg-amber-500 hover:bg-amber-500 mb-1.5 text-white">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Most Requested
                  </Badge>
                  <h3 className="font-semibold text-lg truncate">{featured.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {featured.role}
                    {featured.experience_years ? ` · ${featured.experience_years} yrs exp` : ""}
                  </p>
                  {featured.specialization && (
                    <p className="text-xs text-muted-foreground truncate">{featured.specialization}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* OUR TEAM */}
        {staff.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader title="Our Team" subtitle={`${staff.length} stylist${staff.length === 1 ? "" : "s"}`} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((s) => (
                <Card key={s.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium truncate">{s.name}</span>
                        {s.is_featured && (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] py-0 h-4">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            Top
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.role}
                        {s.experience_years ? ` · ${s.experience_years} yrs` : ""}
                      </p>
                      {s.specialization && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{s.specialization}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SERVICES */}
        <section className="animate-fade-in">
          <SectionHeader title="Services & Pricing" subtitle={services.length ? `${services.length} services` : undefined} />
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Services coming soon.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedServices).map(([cat, list]) => (
                <div key={cat}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {list.map((s) => (
                      <Card key={s.id} className="group hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.name}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {s.duration_minutes} min
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-primary">
                              ₹{(s.price_cents / 100).toFixed(0)}
                            </div>
                            <button
                              onClick={() => navigate(`/book/${salon.id}`)}
                              className="text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Book →
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REVIEWS */}
        <section className="animate-fade-in">
          <SectionHeader title="Customer Reviews" subtitle={rating.count > 0 ? `${rating.count} review${rating.count === 1 ? "" : "s"}` : undefined} />
          {rating.count === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No reviews yet. Be the first to share your experience!
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-3 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardContent className="p-5 flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{rating.avg.toFixed(1)}</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= Math.round(rating.avg)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rating.count} reviews</p>
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    Based on verified customer visits to {salon.name}.
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm truncate">
                            {r.customer_name || "Guest"}
                          </span>
                        </div>
                        <div className="flex shrink-0">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i <= r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.feedback && <p className="text-sm text-muted-foreground">{r.feedback}</p>}
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>

        {/* BUSINESS INFO */}
        <section className="animate-fade-in">
          <SectionHeader title="Business Information" />
          <Card>
            <CardContent className="p-4 divide-y divide-border/50">
              <InfoRow
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={contact || "—"}
                href={contact ? `tel:${contact}` : undefined}
              />
              <InfoRow
                icon={<Clock className="w-4 h-4" />}
                label="Hours"
                value={
                  salon.opening_time && salon.closing_time
                    ? `${salon.opening_time} – ${salon.closing_time}`
                    : "—"
                }
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label="Address"
                value={salon.address || "—"}
                href={mapsUrl || undefined}
                external
              />
              {instagram && (
                <InfoRow
                  icon={<Instagram className="w-4 h-4" />}
                  label="Instagram"
                  value={instagram.replace(/^https?:\/\//, "")}
                  href={instagram}
                  external
                />
              )}
              {website && (
                <InfoRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Website"
                  value={website.replace(/^https?:\/\//, "")}
                  href={website}
                  external
                />
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Sticky bottom CTA (mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-30 md:hidden p-3 bg-background/90 backdrop-blur-xl border-t border-border/50">
        <div className="grid grid-cols-2 gap-2 max-w-5xl mx-auto">
          <Button size="lg" onClick={() => navigate(`/checkin/${salon.id}`)}>
            <Users className="w-4 h-4 mr-2" />
            Join Queue
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate(`/book/${salon.id}`)}>
            <Calendar className="w-4 h-4 mr-2" />
            Book
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-0">
          {lightbox && (
            <img src={lightbox} alt={salon.name} className="w-full h-auto max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex items-end justify-between mb-3">
    <h3 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h3>
    {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
  </div>
);

const StatTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl bg-background/70 backdrop-blur border border-border/50 p-3 text-center">
    <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px] uppercase tracking-wider">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-1 font-semibold text-sm md:text-base truncate">{value}</div>
  </div>
);

const InfoRow = ({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) => {
  const content = (
    <div className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
  if (!href) return content;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="block hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors"
    >
      {content}
    </a>
  );
};

export default SalonProfile;
