import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "@/components/LayoutContent";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
        className={`${inter.variable} ${mono.variable} ${inter.className} bg-[#0A0A0A] text-white min-h-screen antialiased`}
      >
        <ThemeProvider>
          <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}
