import SidebarRevendedora from '@/components/revendedora/SidebarRevendedora';
import HeaderRevendedora from '@/components/revendedora/HeaderRevendedora';

export default function RevendedoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarRevendedora />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderRevendedora />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}