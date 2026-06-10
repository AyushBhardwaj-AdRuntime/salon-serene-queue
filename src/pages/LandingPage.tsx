import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scissors,
  QrCode,
  CalendarCheck,
  Star,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-serif font-bold text-foreground">SalonQ</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/salons")}>
              Find Salons
            </Button>
            <Button size="sm" onClick={() => navigate("/login")} className="rounded-full px-5">
              Staff Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-secondary/20" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-tight mb-6">
              Skip the Wait,{" "}
              <span className="text-primary">Join the Queue</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Find nearby salons, join queues remotely, book appointments, and track your wait
              time — all from your phone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full px-8 text-base gap-2 shadow-lg shadow-primary/25"
                onClick={() => navigate("/salons")}
              >
                <MapPin className="w-5 h-5" />
                Find Nearby Salons
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-base gap-2"
                onClick={() => navigate("/login")}
              >
                Staff Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete salon experience — from discovery to checkout.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: "Live Queue",
                desc: "Real-time queue updates with estimated wait times for every service.",
                color: "bg-primary/10 text-primary",
              },
              {
                icon: QrCode,
                title: "QR Check-in",
                desc: "Scan a QR code at the salon to instantly join the queue.",
                color: "bg-[hsl(var(--status-serving))]/10 text-[hsl(var(--status-serving))]",
              },
              {
                icon: CalendarCheck,
                title: "Book Ahead",
                desc: "Schedule appointments in advance and skip the walk-in wait.",
                color: "bg-[hsl(var(--status-waiting))]/10 text-[hsl(var(--status-waiting))]",
              },
              {
                icon: Star,
                title: "Ratings & Reviews",
                desc: "Read reviews and rate your experience to help others choose.",
                color: "bg-accent text-accent-foreground",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card
                key={title}
                className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to a wait-free salon experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: MapPin,
                title: "Find a Salon",
                desc: "Browse nearby salons, compare wait times, and check ratings.",
              },
              {
                step: "02",
                icon: QrCode,
                title: "Join the Queue",
                desc: "Scan the QR code or join online — pick your service and you're in.",
              },
              {
                step: "03",
                icon: Clock,
                title: "Get Served",
                desc: "Track your position in real-time and arrive when it's your turn.",
              },
            ].map(({ step, icon: Icon, title, desc }, idx) => (
              <div key={step} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary/60 mb-2">STEP {step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
                {idx < 2 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-8 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Salon Owners CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
            Own a Salon?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Register your salon, manage queues, track analytics, and grow your customer loyalty
            — all in one place.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25"
            onClick={() => navigate("/login")}
          >
            <Scissors className="w-5 h-5" />
            Register Your Salon
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t bg-card/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-foreground">SalonQ</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SalonQ. Smart queue management for modern salons.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <button className="hover:text-primary transition-colors" onClick={() => navigate("/salons")}>
              Find Salons
            </button>
            <button className="hover:text-primary transition-colors" onClick={() => navigate("/login")}>
              Staff Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
