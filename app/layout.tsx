import type { Metadata } from "next";
import "./globals.css";
import { MetricaProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Metrica — Legal Metrology Regulatory Integrity Network",
  description:
    "Official Legal Metrology regulatory oversight platform for weighing and measuring instruments lifecycle management, inspection triage, and trust verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="bg-surface" lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-screen font-sans antialiased">
        <MetricaProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </MetricaProvider>
      </body>
    </html>
  );
}
