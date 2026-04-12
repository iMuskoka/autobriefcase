import { AddVehicleForm } from "@/components/fleet/AddVehicleForm";

export const metadata = {
  title: "Add Vehicle | AutoBriefcase",
};

export default function AddVehiclePage() {
  return (
    <div className="max-w-lg mx-auto p-6 lg:p-8">
      <AddVehicleForm />
    </div>
  );
}
