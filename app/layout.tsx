import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { MetricaProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n";

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
    <html className="bg-surface" lang="en" suppressHydrationWarning>
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
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="bg-surface text-on-surface min-h-screen font-sans antialiased" suppressHydrationWarning>
        {/* Hidden Bridge for Dynamic Real-Time Neural Translation */}
        <div id="google_translate_element" style={{ display: "none" }} />
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function() {
                try {
                  if (window.google && window.google.translate) {
                    new window.google.translate.TranslateElement({
                      pageLanguage: 'en',
                      includedLanguages: 'hi,en',
                      autoDisplay: false,
                      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                    }, 'google_translate_element');
                  }
                } catch(e) {}
              };
            `,
          }}
        />
        <Script
          id="google-translate-script"
          strategy="afterInteractive"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />

        <I18nProvider>
          <MetricaProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </MetricaProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
