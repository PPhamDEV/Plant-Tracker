import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/nav";
import { AuthSessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plant Tracker",
  description: "Verfolge deine Pflanzen, Gießpläne und Wachstum.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plant Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthSessionProvider>
          <ToastProvider>
            <main className="mx-auto max-w-2xl px-4 pb-20 pt-6">{children}</main>
            <BottomNav />
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
