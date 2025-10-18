"use client";

import { AvailabilityManager } from "@/app/components/availability/availability-manager-simple";

export default function AvailabilityPage() {
  const handleUpdate = () => {
    // Callback for when availability is updated
    console.log("Availability updated");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disponibilité pour les clients</h1>
          <p className="text-muted-foreground">
            Définissez les créneaux que vos clients peuvent voir et réserver
          </p>
        </div>
      </div>

      <AvailabilityManager onUpdate={handleUpdate} />
    </div>
  );
}
