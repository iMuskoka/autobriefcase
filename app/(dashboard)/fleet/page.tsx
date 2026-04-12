import { FleetHealthHero } from "@/components/fleet/FleetHealthHero";

export const metadata = {
  title: "Fleet | AutoBriefcase",
};

export default function FleetPage() {
  // Epic 2 will add: const supabase = await createClient(); then query vehicles
  // and pass real state + vehicleCount based on DB result.
  // For Story 1.7: hardcode empty state — no vehicles exist yet.
  return (
    <div className="p-6 lg:p-8">
      <FleetHealthHero state="empty" />
    </div>
  );
}
