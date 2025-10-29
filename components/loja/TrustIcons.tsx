"use client";
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { useLojaInfo } from '@/contexts/LojaContext';

const benefits = [
  { 
    icon: ShieldCheck, 
    title: 'Compra 100% Segura',
    description: 'Seus dados protegidos'
  },
  { 
    icon: Truck, 
    title: 'Frete para todo Brasil',
    description: 'Entrega rápida e garantida'
  },
  { 
    icon: CreditCard, 
    title: 'Parcele em até 6x',
    description: 'Sem juros no cartão'
  },
];

export default function TrustIcons() {
  const loja = useLojaInfo();
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  return (
    <section className="w-full bg-white py-8 md:py-10 border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop e Tablet: Linha Horizontal */}
        <div className="hidden sm:flex items-center justify-center gap-8 md:gap-16 lg:gap-20">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-4 group transition-all duration-500 hover:scale-105"
              >
                {/* Ícone Maior */}
                <div 
                  className="flex-shrink-0 w-[70px] h-[70px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center transition-all duration-500 group-hover:shadow-lg"
                  style={{ 
                    backgroundColor: `${corPrimaria}12`,
                  }}
                >
                  <IconComponent 
                    className="transition-all duration-500 group-hover:scale-110" 
                    size={40}
                    strokeWidth={1.5}
                    style={{ color: corPrimaria }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold text-sm md:text-base mb-0.5 tracking-tight whitespace-nowrap">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm whitespace-nowrap">
                    {benefit.description}
                  </p>
                </div>

                {/* Separador sutil entre itens (exceto o último) */}
                {index < benefits.length - 1 && (
                  <div className="hidden lg:block w-px h-12 bg-gray-200 ml-8" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Carrossel simples com scroll horizontal */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-2">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-3 min-w-[280px]"
                >
                  {/* Ícone */}
                  <div 
                    className="flex-shrink-0 w-[70px] h-[70px] rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${corPrimaria}12`,
                    }}
                  >
                    <IconComponent 
                      size={35}
                      strokeWidth={1.5}
                      style={{ color: corPrimaria }}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-sm mb-0.5 tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-500 text-xs">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
