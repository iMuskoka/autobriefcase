import Link from "next/link";
import { Button } from "./ui/button";
import { getClaims } from "@/lib/auth/get-claims";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const claims = await getClaims();

  return claims ? (
    <div className="flex items-center gap-4">
      Hey, {claims.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
