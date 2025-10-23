"use client";
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';

const icons = [
  { icon: ShieldCheck, text: 'Compra 100% Segura', description: 'Dados protegidos' },
  { icon: Truck, text: 'Enviamos para todo Brasil', description: 'Frete rápido e seguro' },
  { icon: CreditCard, text: 'Parcele suas compras', description: 'Em até 6x sem juros' },
];

export default function TrustIcons() {
  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
    </section>
  );
}
