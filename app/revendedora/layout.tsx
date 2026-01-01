"use client";

import SidebarRevendedora from '@/components/revendedora/SidebarRevendedora';

export default function RevendedoraRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarRevendedora />
      <main className="flex-1 w-full lg:ml-0">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
