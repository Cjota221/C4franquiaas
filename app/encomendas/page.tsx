/**
 * Página de Catálogo de Encomendas - SERVER COMPONENT
 * 
 * ✅ Busca produtos no SERVIDOR (sem loading spinner)
 * ✅ HTML pré-renderizado com todos os produtos
 * ✅ Interatividade (busca) apenas no componente cliente
 */

import { getEncomendasProdutos } from '@/lib/encomendas';
import ProdutosGrid from '@/components/encomendas/ProdutosGrid';

export default async function CatalogoEncomendasPage() {
  // ✅ Busca no servidor - usuário vê produtos instantaneamente
  const produtos = await getEncomendasProdutos();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho - Server rendered */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Nossos Produtos
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecione um produto, monte sua grade personalizada e faça seu
          orçamento via WhatsApp
        </p>
      </div>

      {/* Grid interativo (Client Component) */}
      <ProdutosGrid produtos={produtos} />
    </div>
  );
}
