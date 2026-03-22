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
    "Protect your projects from scope creep. Track deliverables, manage revisions, and handle change requests professionally.",
  icons: {
    icon: "/icon.svg",
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
