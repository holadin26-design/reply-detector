import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper"; // Need a client component wrapper for pathname

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReplyRadar - Positive Response Detector",
  description: "AI-powered cold email reply analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex overflow-hidden`}>
        <SidebarWrapper />
        <main className="flex-1 h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
