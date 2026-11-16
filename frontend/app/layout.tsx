import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import AuthGate from "@/components/auth/AuthGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Infinity ERP",
  description: "Infinity Engineering Solutions ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AuthGate>
          <div className="flex min-h-screen flex-col lg:flex-row">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}