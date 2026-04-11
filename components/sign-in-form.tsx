"use client";

import { cn } from "@/lib/utils";
import { signInAction } from "@/lib/actions/auth";
import { signInSchema, type SignInFormValues } from "@/lib/validations/auth";
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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: SignInFormValues) => {
    const result = await signInAction(values.email, values.password);
    if (!result.success) {
      setError("root", { message: result.error });
    }
    // Success: signInAction calls redirect("/fleet") server-side — no client handling needed
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn(
                    "min-h-[44px]",
                    errors.email && "border-destructive",
                  )}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
