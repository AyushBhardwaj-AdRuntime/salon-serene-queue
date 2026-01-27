import { useEffect } from "react";
import { Header } from "@/components/Header";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { QueueList } from "@/components/QueueList";
import { QueueStats } from "@/components/QueueStats";
import { SalonQRCode } from "@/components/SalonQRCode";
import { DisplayLinks } from "@/components/DisplayLinks";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalons } from "@/hooks/useSalons";
import { useAuth } from "@/hooks/useAuth";
import { RegisterSalonForm } from "@/components/RegisterSalonForm";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";

export function StaffDashboard() {
  const { user, signOut } = useAuth();
  const { mySalon, fetchMySalon, isLoading: salonsLoading } = useSalons();
  const { 
    customers, 
    isLoading: customersLoading, 
    addCustomer, 
    updateStatus, 
    removeCustomer, 
    getEstimatedWaitTime 
  } = useCustomers(mySalon?.id);

  useEffect(() => {
    if (user) {
      fetchMySalon(user.id);
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{mySalon.name}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <QueueStats customers={customers} />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AddCustomerForm onAddCustomer={addCustomer} />
          <SalonQRCode salonId={mySalon.id} salonName={mySalon.name} />
          <DisplayLinks salonId={mySalon.id} />
        </div>
        
        <QueueList
          customers={customers}
          isLoading={customersLoading}
          onUpdateStatus={updateStatus}
          onRemove={removeCustomer}
          getEstimatedWaitTime={getEstimatedWaitTime}
        />
      </main>
    </div>
  );
}
