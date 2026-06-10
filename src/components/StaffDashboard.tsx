import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { QueueList } from "@/components/QueueList";
import { QueueStats } from "@/components/QueueStats";
import { SalonQRCode } from "@/components/SalonQRCode";
import { DisplayLinks } from "@/components/DisplayLinks";
import { PendingRequests } from "@/components/PendingRequests";
import { SalonSettings } from "@/components/SalonSettings";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { AppointmentList } from "@/components/AppointmentList";
import { LoyaltyManagement } from "@/components/LoyaltyManagement";
import { useCustomers } from "@/hooks/useCustomers";
import { useAppointments } from "@/hooks/useAppointments";
import { useSalons } from "@/hooks/useSalons";
import { useAuth } from "@/hooks/useAuth";
import { RegisterSalonForm } from "@/components/RegisterSalonForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Store, Users, Calendar, BarChart, Settings, Gift, Scissors } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function StaffDashboard() {
  const { user, signOut } = useAuth();
  const { mySalon, fetchMySalon, isLoading: salonsLoading } = useSalons();
  const {
    customers,
    isLoading: customersLoading,
    addCustomer,
    updateStatus,
    approveRequest,
    rejectRequest,
    removeCustomer,
    getEstimatedWaitTime,
  } = useCustomers(mySalon?.id);

  const {
    appointments,
    isLoading: appointmentsLoading,
    updateAppointmentStatus,
    cancelAppointment,
  } = useAppointments(mySalon?.id);

  const [activeTab, setActiveTab] = useState("queue");

  useEffect(() => {
    if (user) {
      fetchMySalon(user.id);
    }
  }, [user]);

  // Refetch salon after settings update
  const handleSettingsUpdate = () => {
    if (user) {
      fetchMySalon(user.id);
    }
  };

  if (salonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Store className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mySalon) {
    return <RegisterSalonForm />;
  }

  // Filter to only show approved customers in queue
  const approvedCustomers = customers.filter(
    (c) => c.request_status === "approved"
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between relative z-10">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            aria-label="Go to home"
            className="flex items-center gap-3 group text-left"
          >
            <div className="p-2 bg-primary-foreground/15 rounded-xl backdrop-blur-sm transition-transform group-hover:scale-105">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif">{mySalon.name}</h1>
              <p className="text-sm opacity-80">{user?.email}</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
            <Button variant="secondary" size="sm" onClick={signOut} className="rounded-full shadow-md">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/80 p-1 rounded-xl">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Queue</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Loyalty</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <QueueStats customers={approvedCustomers} />

            {/* Pending Requests */}
            <PendingRequests
              customers={customers}
              onApprove={approveRequest}
              onReject={rejectRequest}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AddCustomerForm onAddCustomer={addCustomer} />
              <SalonQRCode salonId={mySalon.id} salonName={mySalon.name} />
              <DisplayLinks salonId={mySalon.id} />
            </div>

            <QueueList
              customers={approvedCustomers}
              isLoading={customersLoading}
              onUpdateStatus={updateStatus}
              onRemove={removeCustomer}
              getEstimatedWaitTime={getEstimatedWaitTime}
              salonId={mySalon.id}
            />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <AppointmentList
              appointments={appointments}
              onUpdateStatus={updateAppointmentStatus}
              onCancel={cancelAppointment}
            />
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <LoyaltyManagement salonId={mySalon.id} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard salonId={mySalon.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SalonSettings
                salon={mySalon as any}
                onUpdate={handleSettingsUpdate}
              />
              <div className="space-y-6">
                <SalonQRCode salonId={mySalon.id} salonName={mySalon.name} />
                <DisplayLinks salonId={mySalon.id} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
