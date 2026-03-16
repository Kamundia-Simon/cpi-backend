import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import { useSidebar } from "../../context/SidebarContext";
import { ROUTES } from "../../constants/routes";

export const AppHeader = () => {
  const { isMobileOpen, toggleSidebar } = useSidebar();

  const showClose = isMobileOpen;

  return (
    <header className="sticky top-0 z-[99998] flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: hamburger toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title={showClose ? "Close menu" : "Toggle menu"}
        >
          {showClose ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile-only logo*/}
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2 lg:hidden"
          title="Dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFD700] text-black">
            <span className="text-lg font-bold leading-none">3</span>
          </div>
          <span className="text-xl">
            <span className="font-semibold">GEM</span>
            <span className="font-normal text-gray-600"> CPI Tracker</span>
          </span>
        </Link>
      </div>

      {/* Right: auth*/}
      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};
