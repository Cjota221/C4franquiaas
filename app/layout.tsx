import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./responsive.css";
import ClientErrorLoggerWrapper from '@/components/ClientErrorLoggerWrapper';
import DebugScriptInjector from "@/components/DebugScriptInjector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { GoogleAnalyticsTracker } from "@/components/GoogleAnalyticsTracker";
import { Suspense } from "react";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C4 Franquias Admin",
  description: "Sistema de gerenciamento C4 Franquias",
  icons: {
    icon: [
      { url: '/logo-original.png', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'C4 Franquias',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#DB1472" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="C4 Franquias" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Google Fonts para os banners customizados */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Oswald:wght@600&family=Poppins:wght@400&family=Merriweather:wght@700&family=Anton&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Google Analytics 4 - C4 Franquias */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q1TM0EYRBN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q1TM0EYRBN', {
              send_page_view: true,
              page_path: window.location.pathname,
              page_location: window.location.href,
              page_title: document.title
            });
            console.log('📊 GA4 Inicializado:', window.location.pathname);
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ClientErrorLoggerWrapper />
        <Suspense fallback={null}>
          <DebugScriptInjector />
          <GoogleAnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
