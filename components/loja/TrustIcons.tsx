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
    <section className="w-full bg-white py-12 md:py-16 border-t border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index} 
                className="flex items-start gap-4 group"
              >
                {/* Ícone */}
                <div 
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${corPrimaria}10`,
                  }}
                >
                  <IconComponent 
                    className="transition-all duration-300" 
                    size={28}
                    strokeWidth={1.5}
                    style={{ color: corPrimaria }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 pt-1">
                  <h3 className="text-gray-900 font-semibold text-base mb-1 tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
