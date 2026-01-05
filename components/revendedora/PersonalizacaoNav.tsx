"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Home, ImageIcon, Upload, Palette, Type, Share2, BarChart3 } from 'lucide-react';

const sections = [
  { id: '', label: 'Visão Geral', icon: Home },
  { id: 'banner', label: 'Banners', icon: ImageIcon },
  { id: 'logo', label: 'Logo', icon: Upload },
  { id: 'cores', label: 'Cores', icon: Palette },
  { id: 'estilos', label: 'Estilos', icon: Type },
  { id: 'redes-sociais', label: 'Redes Sociais', icon: Share2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function PersonalizacaoNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSection = searchParams.get('secao') || '';

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === '') {
      router.push('/revendedora/personalizacao');
    } else {
      router.push(`/revendedora/personalizacao?secao=${sectionId}`);
    }
    
    // Scroll suave para o topo
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = currentSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`
                flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-all
                ${isActive 
                  ? 'border-b-2 border-pink-500 text-pink-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
