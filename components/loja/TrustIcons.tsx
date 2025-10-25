"use client";
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';

const icons = [
  { icon: ShieldCheck, text: 'Compra 100% Segura', description: 'Dados protegidos' },
  { icon: Truck, text: 'Enviamos para todo Brasil', description: 'Frete rápido e seguro' },
  { icon: CreditCard, text: 'Parcele suas compras', description: 'Em até 6x sem juros' },
];

export default function TrustIcons() {
  return (
    <>
      {/* Mobile: Marquee Horizontal Infinito */}
      <div className="md:hidden overflow-hidden bg-gradient-to-r from-pink-50 to-purple-50 py-4">
        <div className="trust-marquee-container">
          <div className="trust-marquee-track">
            {/* Renderizar itens 2x para loop infinito */}
            {[...icons, ...icons].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={i} 
                  className="trust-marquee-item"
                >
                  <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
                    <div className="text-pink-600 bg-pink-100 p-2 rounded-full flex-shrink-0">
                      <IconComponent size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800 whitespace-nowrap">{item.text}</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Layout Estático em Grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-8 text-center">
          {icons.map((item, i) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center text-gray-700 p-6 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-pink-600 mb-3 p-3 bg-pink-50 rounded-full">
                  <IconComponent size={32} strokeWidth={2} />
                </div>
                <p className="font-bold text-lg mb-1">{item.text}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Inline para Animação Marquee */}
      <style jsx>{`
        .trust-marquee-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }

        .trust-marquee-track {
          display: inline-flex;
          gap: 16px;
          animation: marquee-scroll 25s linear infinite;
          will-change: transform;
        }

        .trust-marquee-item {
          display: inline-block;
          flex-shrink: 0;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Pausar animação ao hover (opcional) */
        .trust-marquee-container:hover .trust-marquee-track {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}
