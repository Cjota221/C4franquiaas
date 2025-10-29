"use client";
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { useLojaInfo } from '@/contexts/LojaContext';

const icons = [
  { icon: ShieldCheck, text: 'Compra 100% Segura', description: 'Dados protegidos' },
  { icon: Truck, text: 'Enviamos para todo Brasil', description: 'Frete rápido e seguro' },
  { icon: CreditCard, text: 'Parcele suas compras', description: 'Em até 6x sem juros' },
];

export default function TrustIcons() {
  const loja = useLojaInfo();

  // Cores personalizadas da franqueada
  const corPrimaria = loja.cor_primaria || '#DB1472';
  const corTexto = loja.cor_texto || '#1F2937';

  // Gerar cor clara para fundo (10% de opacidade da cor primária)
  const corFundoClaro = `${corPrimaria}1a`; // Hex + Alpha

  return (
    <>
      {/* Mobile: Marquee Horizontal Infinito */}
      <div 
        className="md:hidden overflow-hidden py-4"
        style={{
          background: `linear-gradient(to right, ${corFundoClaro}, ${corPrimaria}10)`,
        }}
      >
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
                    <div 
                      className="p-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: corFundoClaro,
                        color: corPrimaria,
                      }}
                    >
                      <IconComponent size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p 
                        className="font-bold text-sm whitespace-nowrap"
                        style={{ color: corTexto }}
                      >
                        {item.text}
                      </p>
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
                className="flex flex-col items-center p-6 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ color: corTexto }}
              >
                <div 
                  className="mb-3 p-3 rounded-full"
                  style={{
                    backgroundColor: corFundoClaro,
                    color: corPrimaria,
                  }}
                >
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
