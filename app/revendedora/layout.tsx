"use client";

import SidebarRevendedora from '@/components/revendedora/SidebarRevendedora';

export default function RevendedoraRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarRevendedora />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
