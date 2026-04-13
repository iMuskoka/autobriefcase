"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteVehicle } from "@/lib/actions/vehicles";

interface VehicleCardMenuProps {
  vehicleId: string;
  vehicleName: string;
}

export function VehicleCardMenu({ vehicleId, vehicleName }: VehicleCardMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if (!result.success) {
        setIsPending(false);
        setShowDeleteDialog(false);
      }
      // On success: redirect("/fleet") happens server-side
    } catch {
      setIsPending(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            Delete vehicle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {vehicleName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all associated documents and reminders. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
