import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LayoutContent } from "@/components/LayoutContent";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScopeGuard — Scope Creep Protection for Freelancers",
  description:
    "Stop scope creep before it kills your profits. ScopeGuard helps freelancers track projects, manage change requests, and protect their revenue.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "ScopeGuard — Scope Creep Protection for Freelancers",
    description:
      "Stop scope creep before it kills your profits. ScopeGuard helps freelancers track projects, manage change requests, and protect their revenue.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} bg-[#0F172A] text-[#F1F5F9] min-h-screen antialiased`}
      >
        <ThemeProvider>
          <Navbar />
          <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}
