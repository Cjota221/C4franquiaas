"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import { useEffect, useState } from 'react';

export default function AnnouncementBar() {
  const loja = useLojaInfo();
  const [mensagemAtual, setMensagemAtual] = useState(0);

  const mensagens = loja?.mensagens_regua && Array.isArray(loja.mensagens_regua) && loja.mensagens_regua.length > 0
    ? loja.mensagens_regua
    : ['Frete grátis acima de R$ 150', 'Parcele em até 6x sem juros', 'Cupom BEMVINDO10 - 10% OFF'];

  useEffect(() => {
    if (mensagens.length > 1) {
      const interval = setInterval(() => {
        setMensagemAtual((prev) => (prev + 1) % mensagens.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mensagens.length]);

  if (!loja) return null;

  return (
    <div 
      style={{ backgroundColor: loja.cor_secundaria || '#6366f1' }} 
      className="text-white text-sm font-semibold text-center py-2 px-4 overflow-hidden"
    >
      <div className="animate-fadeIn">
        {mensagens[mensagemAtual]}
      </div>
    </div>
  );
}
