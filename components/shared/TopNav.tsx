import Link from "next/link";
import { TopNavLinks } from "./TopNavLinks";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function TopNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-secondary flex items-center px-6 gap-6">
      <Link
        href="/fleet"
        className="font-heading font-bold text-primary text-lg shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        AutoBriefcase
      </Link>
      <div className="flex-1">
        <TopNavLinks />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeSwitcher />
        <SignOutButton />
      </div>
    </header>
  );
}
