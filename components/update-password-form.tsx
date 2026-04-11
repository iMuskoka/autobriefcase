"use client";

import { cn } from "@/lib/utils";
import { updatePasswordAction } from "@/lib/actions/auth";
import {
  updatePasswordSchema,
  type UpdatePasswordFormValues,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    const result = await updatePasswordAction(values.password);
    if (!result.success) {
      setError("root", { message: result.error });
    }
    // Success: updatePasswordAction calls redirect("/fleet") server-side
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>Enter and confirm your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={cn(
                    "min-h-[44px]",
                    errors.password && "border-destructive",
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p id="password-error" className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className={cn(
                    "min-h-[44px]",
                    errors.confirmPassword && "border-destructive",
                  )}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    className="text-destructive text-sm"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {errors.root && (
                <p className="text-destructive text-sm">
                  {errors.root.message}
                </p>
              )}
              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
