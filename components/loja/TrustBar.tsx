"use client";
import React from 'react';
import { Truck, Shield, Award } from 'lucide-react';

interface TrustBarProps {
  corPrimaria?: string;
}

const trustItems = [
  {
    icon: Truck,
    text: 'Enviamos para todo o Brasil',
  },
  {
    icon: Shield,
    text: 'Compra 100% Segura',
  },
  {
    icon: Award,
    text: 'Receba seu produto ou seu dinheiro de volta',
  },
];

export default function TrustBar({ corPrimaria = '#DB1472' }: TrustBarProps) {
  // Duplicar os itens para criar o efeito de loop infinito
  const duplicatedItems = [...trustItems, ...trustItems, ...trustItems];

  return (
    <div className="trust-bar-wrapper">
      <div className="trust-bar-track">
        {duplicatedItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="trust-item">
              <Icon size={18} className="trust-icon" />
              <span className="trust-text">{item.text}</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .trust-bar-wrapper {
          width: 100%;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            ${corPrimaria}08,
            ${corPrimaria}12
          );
          border-radius: 12px;
          padding: 16px 0;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* Gradiente nas bordas para efeito fade */
        .trust-bar-wrapper::before,
        .trust-bar-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 60px;
          z-index: 2;
          pointer-events: none;
        }

        .trust-bar-wrapper::before {
          left: 0;
          background: linear-gradient(
            to right,
            ${corPrimaria}12,
            transparent
          );
        }

        .trust-bar-wrapper::after {
          right: 0;
          background: linear-gradient(
            to left,
            ${corPrimaria}12,
            transparent
          );
        }

        .trust-bar-track {
          display: flex;
          gap: 48px;
          animation: scroll 30s linear infinite;
          width: max-content;
        }

        /* Animação de scroll infinito */
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        /* Pausar animação ao hover (opcional) */
        .trust-bar-wrapper:hover .trust-bar-track {
          animation-play-state: paused;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          padding: 0 24px;
        }

        .trust-icon {
          color: ${corPrimaria};
          flex-shrink: 0;
        }

        .trust-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.01em;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .trust-bar-wrapper {
            padding: 12px 0;
          }

          .trust-bar-track {
            gap: 36px;
          }

          .trust-item {
            padding: 0 16px;
          }

          .trust-text {
            font-size: 0.85rem;
          }

          .trust-icon {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
}
