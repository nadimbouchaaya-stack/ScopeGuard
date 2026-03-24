"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/auth"];

function isPublicRoute(pathname: string) {
  if (pathname.startsWith("/portal")) return true;
  if (pathname.startsWith("/auth")) return true;
  return PUBLIC_ROUTES.includes(pathname);
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);
  const isLanding = pathname === "/";

  if (isPublic) {
    return (
      <>
        <Navbar />
        {isLanding ? (
          <main>{children}</main>
        ) : (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
            {children}
          </main>
        )}
      </>
    );
  }

  // Authenticated layout with sidebar
  return (
    <>
      <AppSidebar />
      <main className="md:ml-[52px] flex-1 flex flex-col min-h-screen pb-[56px] md:pb-0">
        {children}
      </main>
    </>
  );
}
