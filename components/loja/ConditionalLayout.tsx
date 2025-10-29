"use client";
import { usePathname } from 'next/navigation';
import LojaHeader from './LojaHeader';
import LojaHeaderMobile from './LojaHeaderMobile';
import LojaFooter from './LojaFooter';
import WhatsAppFlutuante from './WhatsAppFlutuante';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  dominio: string;
}

export default function ConditionalLayout({ children, dominio }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isCheckout = pathname?.includes('/checkout');

  if (isCheckout) {
    // Checkout: sem header/footer, só o conteúdo
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Páginas normais: com header/footer
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Desktop - Oculto em mobile */}
      <div className="desktop-only">
        <LojaHeader dominio={dominio} />
      </div>

      {/* Header Mobile - Apenas em mobile */}
      <div className="mobile-only">
        <LojaHeaderMobile dominio={dominio} />
      </div>
      
      <main className="flex-1">
        {children}
      </main>
      
      <LojaFooter />
      <WhatsAppFlutuante />
    </div>
  );
}
