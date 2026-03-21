import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScopeGuard — Scope Creep Protection for Freelancers",
  description:
    "Protect your projects from scope creep. Track deliverables, manage revisions, and handle change requests professionally.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[#0F172A] text-[#F1F5F9] min-h-screen antialiased`}
      >
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
