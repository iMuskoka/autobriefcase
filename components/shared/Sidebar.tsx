import { createClient } from "@/lib/supabase/server";
import type { VehicleCategory } from "@/types";
import {
  VEHICLE_CATEGORY_ICONS,
  VEHICLE_CATEGORY_FALLBACK_ICON,
} from "@/lib/vehicle-categories";

export async function Sidebar() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, category, make, model, nickname")
    .order("created_at", { ascending: true });

  const vehicles = data ?? [];

  return (
    <nav
      aria-label="Fleet navigation"
      className="flex flex-col w-full h-full py-4"
    >
      <div className="px-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your fleet
        </p>
      </div>
      {vehicles.length === 0 ? (
        <div className="px-4">
          <p className="text-sm text-muted-foreground">No vehicles yet</p>
        </div>
      ) : (
        <ul className="flex flex-col px-2">
          {vehicles.map((v) => {
            const Icon =
              VEHICLE_CATEGORY_ICONS[v.category as VehicleCategory] ??
              VEHICLE_CATEGORY_FALLBACK_ICON;
            const name = v.nickname ?? `${v.make} ${v.model}`;
            return (
              <li
                key={v.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm"
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                  className="text-muted-foreground shrink-0"
                />
                <span className="truncate flex-1 text-foreground">{name}</span>
                {/* Health dot — always no-docs (slate) until Epic 3 */}
                <span
                  className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0"
                  aria-hidden="true"
                />
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
