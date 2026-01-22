import { Header } from "@/components/Header";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { QueueStats } from "@/components/QueueStats";
import { QueueList } from "@/components/QueueList";
import { useCustomers } from "@/hooks/useCustomers";

const Index = () => {
  const {
    customers,
    isLoading,
    addCustomer,
    updateStatus,
    removeCustomer,
    getEstimatedWaitTime,
  } = useCustomers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container max-w-4xl py-8 px-4">
        <Header />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Add Form */}
          <div className="lg:col-span-1">
            <AddCustomerForm onAddCustomer={addCustomer} />
          </div>

          {/* Right Column - Queue */}
          <div className="lg:col-span-2 space-y-6">
            <QueueStats customers={customers} />
            <QueueList
              customers={customers}
              isLoading={isLoading}
              getEstimatedWaitTime={getEstimatedWaitTime}
              onUpdateStatus={updateStatus}
              onRemove={removeCustomer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
