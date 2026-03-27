import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { Backdrop } from "./Backdrop";
import { useSidebar } from "../../context/SidebarContext";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AppSidebar />

      {/* Mobile backdrop */}
      <Backdrop />

      {/* Sidebar shift state*/}
      <div
        className={[
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]",
        ].join(" ")}
      >
        <AppHeader />

        <main className="flex-1 flex flex-col p-4 md:p-6">{children}</main>

        <footer className="px-4 py-4 md:px-6 border-t border-gray-100">
          <p className="text-center text-sm text-gray-400">
            © 2026 3GEM CPI Dashboard. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};
