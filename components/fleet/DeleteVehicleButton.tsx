"use client";

import { useState } from "react";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteVehicleButton({
  vehicleId,
  vehicleName,
}: {
  vehicleId: string;
  vehicleName: string;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if (!result.success) {
        // On failure, re-enable button — user can retry or cancel
        setIsPending(false);
      }
      // On success: deleteVehicle calls redirect("/fleet") server-side — component unmounts
    } catch {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] text-destructive hover:text-destructive"
        >
          Delete vehicle
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {vehicleName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all associated documents and reminders. This action
            cannot be undone.
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
  );
}
