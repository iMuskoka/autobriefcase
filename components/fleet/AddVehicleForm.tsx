"use client";

import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { createVehicle } from "@/lib/actions/vehicles";
import { vehicleSchema, type VehicleFormValues } from "@/lib/validations/vehicle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VehicleCategoryPicker } from "./VehicleCategoryPicker";

export function AddVehicleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: VehicleFormValues) => {
    try {
      const result = await createVehicle(values);
      if (!result.success) {
        setError("root", { message: result.error });
      }
      // On success, createVehicle calls redirect("/fleet") server-side
    } catch {
      setError("root", { message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add a Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">

              {/* Category */}
              <div className="grid gap-2">
                <Label id="category-label">Vehicle Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <VehicleCategoryPicker
                      value={field.value}
                      onValueChange={field.onChange}
                      error={errors.category?.message}
                      labelId="category-label"
                    />
                  )}
                />
              </div>

              {/* Make */}
              <div className="grid gap-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Tesla, Ford, Honda"
                  className={cn(
                    "min-h-[44px]",
                    errors.make && "border-destructive",
                  )}
                  aria-invalid={!!errors.make}
                  aria-describedby={errors.make ? "make-error" : undefined}
                  {...register("make")}
                />
                {errors.make && (
                  <p id="make-error" className="text-destructive text-sm">
                    {errors.make.message}
                  </p>
                )}
              </div>

              {/* Model */}
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Model 3, F-150, Civic"
                  className={cn(
                    "min-h-[44px]",
                    errors.model && "border-destructive",
                  )}
                  aria-invalid={!!errors.model}
                  aria-describedby={errors.model ? "model-error" : undefined}
                  {...register("model")}
                />
                {errors.model && (
                  <p id="model-error" className="text-destructive text-sm">
                    {errors.model.message}
                  </p>
                )}
              </div>

              {/* Year */}
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2024"
                  className={cn(
                    "min-h-[44px]",
                    errors.year && "border-destructive",
                  )}
                  aria-invalid={!!errors.year}
                  aria-describedby={errors.year ? "year-error" : undefined}
                  {...register("year", { valueAsNumber: true })}
                />
                {errors.year && (
                  <p id="year-error" className="text-destructive text-sm">
                    {errors.year.message}
                  </p>
                )}
              </div>

              {/* Nickname (optional) */}
              <div className="grid gap-2">
                <Label htmlFor="nickname">Nickname (optional)</Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Daily Driver, Weekend Boat"
                  className={cn(
                    "min-h-[44px]",
                    errors.nickname && "border-destructive",
                  )}
                  aria-invalid={!!errors.nickname}
                  aria-describedby={
                    errors.nickname ? "nickname-error" : "nickname-hint"
                  }
                  {...register("nickname")}
                />
                {errors.nickname ? (
                  <p id="nickname-error" className="text-destructive text-sm">
                    {errors.nickname.message}
                  </p>
                ) : (
                  <p id="nickname-hint" className="text-muted-foreground text-xs">
                    A friendly name to help you identify this vehicle
                  </p>
                )}
              </div>

              {/* Notes (optional) */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Registered in NY, insurance details..."
                  className={cn(errors.notes && "border-destructive")}
                  aria-invalid={!!errors.notes}
                  aria-describedby={errors.notes ? "notes-error" : undefined}
                  {...register("notes")}
                />
                {errors.notes && (
                  <p id="notes-error" className="text-destructive text-sm">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Root error */}
              {errors.root && (
                <p role="alert" className="text-destructive text-sm">
                  {errors.root.message}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  type="submit"
                  className="w-full min-h-[44px] sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding vehicle…" : "Add Vehicle"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full min-h-[44px] sm:w-auto"
                  asChild
                >
                  <Link href="/fleet">Cancel</Link>
                </Button>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
