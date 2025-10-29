"use client";
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { useLojaInfo } from '@/contexts/LojaContext';

const benefits = [
  { 
    icon: ShieldCheck, 
    title: 'Compra 100% Segura',
    subtitle: 'Seus dados protegidos'
  },
  { 
    icon: Truck, 
    title: 'Enviamos para todo Brasil',
    subtitle: 'Entrega rápida e garantida'
  },
  { 
    icon: CreditCard, 
    title: 'Parcele suas compras',
    subtitle: 'Em até 6x sem juros'
  },
];

export default function TrustIcons() {
  const loja = useLojaInfo();
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  return (
    <section className="benefits-section">
      <div className="benefits-container">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <div key={index} className="benefit-item">
              <div className="benefit-icon-wrapper">
                <IconComponent 
                  className="benefit-icon" 
                  size={32} 
                  strokeWidth={1.8} 
                />
              </div>
              <div className="benefit-content">
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-subtitle">{benefit.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .benefits-section {
          width: 100%;
          background: #ffffff;
          padding: 32px 0;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }

        .benefits-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: transform 0.3s ease;
        }

        .benefit-item:hover {
          transform: translateY(-2px);
        }

        .benefit-icon-wrapper {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: ${corPrimaria}08;
          transition: all 0.3s ease;
        }

        .benefit-item:hover .benefit-icon-wrapper {
          background: ${corPrimaria}12;
          transform: scale(1.05);
        }

        .benefit-icon {
          color: ${corPrimaria};
        }

        .benefit-content {
          flex: 1;
          padding-top: 4px;
        }

        .benefit-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
          line-height: 1.4;
          letter-spacing: -0.01em;
        }

        .benefit-subtitle {
          font-size: 0.875rem;
          font-weight: 400;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .benefits-container {
            gap: 32px;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .benefits-section {
            padding: 24px 0;
          }

          .benefits-container {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 0 20px;
          }

          .benefit-item {
            gap: 14px;
          }

          .benefit-icon-wrapper {
            width: 48px;
            height: 48px;
          }

          .benefit-icon {
            width: 26px;
            height: 26px;
          }

          .benefit-title {
            font-size: 0.9375rem;
          }

          .benefit-subtitle {
            font-size: 0.8125rem;
          }
        }

        /* Mobile Small */
        @media (max-width: 480px) {
          .benefits-section {
            padding: 20px 0;
          }

          .benefits-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </section>
  );
}
