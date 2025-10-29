"use client";
import React from 'react';
import { Truck, Shield, CreditCard } from 'lucide-react';

interface TrustBarProps {
  corPrimaria?: string;
}

const trustItems = [
  {
    icon: CreditCard,
    text: 'Parcele suas compras',
    subtitle: 'Em até 6x sem juros'
  },
  {
    icon: Shield,
    text: 'Compra 100% Segura',
    subtitle: 'Dados protegidos'
  },
  {
    icon: Truck,
    text: 'Frete para todo Brasil',
    subtitle: 'Entrega garantida'
  },
];

export default function TrustBar({ corPrimaria = '#DB1472' }: TrustBarProps) {
  // Duplicar os itens para criar o efeito de loop infinito suave
  const duplicatedItems = [...trustItems, ...trustItems, ...trustItems];

  return (
    <div className="trust-bar-container">
      <div className="trust-bar-wrapper">
        <div className="trust-bar-track">
          {duplicatedItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="trust-item">
                <div className="trust-icon-wrapper">
                  <Icon size={20} className="trust-icon" strokeWidth={1.5} />
                </div>
                <div className="trust-content">
                  <span className="trust-text">{item.text}</span>
                  <span className="trust-subtitle">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .trust-bar-container {
          width: 100%;
          margin: 0;
          padding: 0;
        }

        .trust-bar-wrapper {
          width: 100%;
          overflow: hidden;
          background: transparent;
          position: relative;
          padding: 20px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        /* Gradiente sutil nas bordas para efeito fade elegante */
        .trust-bar-wrapper::before,
        .trust-bar-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }

        .trust-bar-wrapper::before {
          left: 0;
          background: linear-gradient(
            to right,
            #ffffff,
            transparent
          );
        }

        .trust-bar-wrapper::after {
          right: 0;
          background: linear-gradient(
            to left,
            #ffffff,
            transparent
          );
        }

        .trust-bar-track {
          display: flex;
          gap: 80px;
          animation: scroll 40s linear infinite;
          width: max-content;
        }

        /* Animação de scroll suave e contínuo */
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        /* Pausar animação ao hover */
        .trust-bar-wrapper:hover .trust-bar-track {
          animation-play-state: paused;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }

        .trust-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${corPrimaria}0a;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .trust-item:hover .trust-icon-wrapper {
          background: ${corPrimaria}15;
          transform: scale(1.05);
        }

        .trust-icon {
          color: ${corPrimaria};
          flex-shrink: 0;
        }

        .trust-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .trust-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          letter-spacing: -0.01em;
        }

        .trust-subtitle {
          font-size: 0.75rem;
          font-weight: 400;
          color: #6b7280;
          letter-spacing: 0;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .trust-bar-wrapper {
            padding: 16px 0;
          }

          .trust-bar-wrapper::before,
          .trust-bar-wrapper::after {
            width: 40px;
          }

          .trust-bar-track {
            gap: 60px;
          }

          .trust-icon-wrapper {
            width: 36px;
            height: 36px;
          }

          .trust-icon {
            width: 18px;
            height: 18px;
          }

          .trust-text {
            font-size: 0.8125rem;
          }

          .trust-subtitle {
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </div>
  );
}
