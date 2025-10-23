"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFlutuante() {
  const loja = useLojaInfo();

  // Não exibe se estiver desativado ou sem número configurado
  if (!loja.whatsapp_flutuante || !loja.whatsapp_numero) {
    return null;
  }

  // Remove caracteres não numéricos do número
  const numeroLimpo = loja.whatsapp_numero.replace(/\D/g, '');

  // Mensagem padrão ou fallback
  const mensagem = loja.whatsapp_mensagem_padrao || 'Olá! Gostaria de mais informações sobre os produtos da loja.';

  // Posição do botão (esquerda ou direita)
  const posicaoClass = loja.whatsapp_posicao === 'esquerda' ? 'left-4 md:left-6' : 'right-4 md:right-6';

  return (
    <a
      href={`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-4 md:bottom-6 ${posicaoClass} z-50 
        bg-green-500 text-white p-4 md:p-5 rounded-full shadow-2xl 
        hover:bg-green-600 hover:scale-110 
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        animate-bounce
        group`}
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        whitespace-nowrap pointer-events-none
        hidden md:block">
        Fale conosco!
      </span>
    </a>
  );
}
