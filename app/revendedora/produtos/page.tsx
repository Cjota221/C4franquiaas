"use client";
import { useState, useEffect } from 'react';
import ProductCardRevendedora from '@/components/revendedora/ProductCardRevendedora';
import { Search, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ResellerProduct = {
  id: string;
  product_id: string;
  is_active: boolean;
  margin_percent: number;
  produtos: {
    id: string;
    nome: string;
    preco: number;
    imagem_url?: string;
  };
};

export default function ProdutosRevendedora() {
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkMargin, setBulkMargin] = useState(30);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const supabase = createClient();
    const { data: reseller } = await supabase.from('resellers').select('id').single();
    if (!reseller) return;

    const { data } = await supabase
      .from('reseller_products')
      .select(`
        *,
        produtos:product_id (
          id,
          nome,
          preco,
          imagem_url
        )
      `)
      .eq('reseller_id', reseller.id);

    setProducts((data as ResellerProduct[]) || []);
    setLoading(false);
  };

  const handleToggle = async (productId: string, isActive: boolean) => {
    const supabase = createClient();
    await supabase
      .from('reseller_products')
      .update({ is_active: isActive })
      .eq('product_id', productId);
  };

  const handleMarginChange = async (productId: string, margin: number) => {
    const supabase = createClient();
    await supabase
      .from('reseller_products')
      .update({ margin_percent: margin })
      .eq('product_id', productId);
    loadProducts();
  };

  const applyBulkMargin = async () => {
    const supabase = createClient();
    const { data: reseller } = await supabase.from('resellers').select('id').single();
    if (!reseller) return;

    await supabase
      .from('reseller_products')
      .update({ margin_percent: bulkMargin })
      .eq('reseller_id', reseller.id);

    setShowBulkModal(false);
    loadProducts();
  };

  const filteredProducts = products.filter(p =>
    p.produtos?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8"><p>Carregando produtos...</p></div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
        <p className="text-gray-500 mt-1">Gerencie os produtos do seu catálogo</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-colors"
        >
          <Percent size={18} />
          Margem em Lote
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((item) => (
          <ProductCardRevendedora
            key={item.id}
            product={{
              id: item.product_id,
              nome: item.produtos?.nome || '',
              preco: item.produtos?.preco || 0,
              imagem_url: item.produtos?.imagem_url,
              is_active: item.is_active,
              margin_percent: item.margin_percent,
            }}
            onToggle={handleToggle}
            onMarginChange={handleMarginChange}
          />
        ))}
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Aplicar Margem em Lote</h3>
            <p className="text-gray-600 mb-4">Esta margem será aplicada a todos os produtos do seu catálogo.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Margem (%)</label>
              <input
                type="number"
                value={bulkMargin}
                onChange={(e) => setBulkMargin(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyBulkMargin}
                className="flex-1 px-4 py-3 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}