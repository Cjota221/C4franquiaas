/**
 * Layout do Sistema de Encomendas - SERVER COMPONENT
 * 
 * ✅ Busca configurações no SERVIDOR (sem waterfall)
 * ✅ HTML pré-renderizado (FCP instantâneo)
 * ✅ Menor bundle JS (apenas interatividade no cliente)
 */

import { getEncomendasConfig } from '@/lib/encomendas';
import EncomendasHeader from '@/components/encomendas/EncomendasHeader';

export default async function EncomendasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Busca no servidor - 0ms de delay para o usuário
  const config = await getEncomendasConfig();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com interatividade (Client Component) */}
      <EncomendasHeader config={config} />

      {/* Conteúdo */}
      <main className="min-h-[calc(100vh-200px)]">{children}</main>

      {/* Footer - Server rendered */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">
              Encomendas por Grade Fechada
            </h3>
            <p className="text-gray-300 mb-4">
              📦 Pedido mínimo: {config?.pedido_minimo_grades || 2} grades | ⏱️
              Prazo: {config?.prazo_producao_min || 15}-
              {config?.prazo_producao_max || 20} dias úteis
            </p>
            {config?.whatsapp_numero && (
              <a
                href={`https://wa.me/${config.whatsapp_numero}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                💬 Fale Conosco pelo WhatsApp
              </a>
            )}
            <p className="text-gray-400 text-sm mt-6">
              © 2026 Sistema de Encomendas - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
