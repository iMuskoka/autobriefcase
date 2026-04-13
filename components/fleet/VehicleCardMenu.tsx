"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VehicleCardMenuProps {
  vehicleId: string;
  vehicleName: string;
}

export function VehicleCardMenu({ vehicleId, vehicleName }: VehicleCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label={`Options for ${vehicleName}`}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/fleet/${vehicleId}/edit`}>Edit vehicle</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/fleet/${vehicleId}/documents/new`}>Upload document</Link>
        </DropdownMenuItem>
        {/* Delete vehicle wired in Story 2.5 */}
        <DropdownMenuItem disabled>Delete vehicle</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
