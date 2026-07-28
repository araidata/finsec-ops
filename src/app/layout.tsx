import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { getGlobalContextOptions } from "@/lib/server/global-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "finsec-ops",
  description:
    "Departmental financial operations for budgets, renewals, vendors, and executive reporting.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="flex min-h-full w-full min-w-full flex-col antialiased">
        <TooltipProvider>
          <Suspense fallback={children}>
            <GlobalContextProvider options={await getGlobalContextOptions()}>
              {children}
            </GlobalContextProvider>
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
