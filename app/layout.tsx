import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./responsive.css";
import ClientErrorLoggerWrapper from '@/components/ClientErrorLoggerWrapper';
import DebugScriptInjector from "@/components/DebugScriptInjector";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense } from "react";

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        </Suspense>
      </body>
    </html>
  );
}
