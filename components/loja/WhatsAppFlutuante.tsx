"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { trackWhatsAppClick } from '@/lib/analytics';

export default function WhatsAppFlutuante() {
  const loja = useLojaInfo();
  const pathname = usePathname();

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

  // ✅ Detectar se está em página de produto (mobile)
  // Se estiver, sobe o botão para não ficar sobre o botão de adicionar
  const isPaginaProduto = pathname?.includes('/produto/');
  const bottomClass = isPaginaProduto 
    ? 'bottom-24 md:bottom-6'  // Mobile: sobe | Desktop: posição normal
    : 'bottom-4 md:bottom-6';  // Posição padrão

  // 📊 Função para trackear clique no WhatsApp
  const handleWhatsAppClick = () => {
    trackWhatsAppClick({
      loja_nome: loja.nome,
      loja_dominio: loja.dominio,
      loja_id: loja.id,
      origem: 'flutuante'
    });
  };

  return (
    <a
      href={`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleWhatsAppClick}
      className={`fixed ${bottomClass} ${posicaoClass} z-40 
        flex flex-col items-center gap-2
        group`}
      aria-label="Contato via WhatsApp"
    >
      {/* Texto "Fale Conosco" */}
      <div className="bg-green-500 text-white text-xs md:text-sm font-semibold py-2 px-3 md:px-4 rounded-full shadow-lg
        group-hover:bg-green-600 transition-all duration-300">
        Fale Conosco
      </div>

      {/* Botão WhatsApp */}
      <div className="bg-green-500 text-white p-4 md:p-5 rounded-full shadow-2xl 
        hover:bg-green-600 hover:scale-110 
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        animate-pulse">
        <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
      </div>
    </a>
  );
}
