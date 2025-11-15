import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Search, MessageCircle } from 'lucide-react';

export default async function CatalogoPublico({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: reseller } = await supabase
    .from('resellers')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!reseller) {
    return notFound();
  }

  await supabase.rpc('increment_catalog_views', { reseller_id_param: reseller.id });

  const { data: products } = await supabase
    .from('reseller_products')
    .select(`
      *,
      produtos:product_id (
        id,
        nome,
        descricao,
        preco,
        imagem_url
      )
    `)
    .eq('reseller_id', reseller.id)
    .eq('is_active', true);

  const primaryColor = reseller.colors?.primary || '#ec4899';
  const secondaryColor = reseller.colors?.secondary || '#8b5cf6';

  const productsWithPrice = products?.map(p => ({
    ...p.produtos,
    finalPrice: p.produtos.preco * (1 + (p.margin_percent || 0) / 100),
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="sticky top-0 z-40 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {reseller.logo_url && (
              <div className="w-16 h-16 bg-white rounded-lg p-2 flex-shrink-0">
                <Image src={reseller.logo_url} alt={reseller.store_name} width={64} height={64} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{reseller.store_name}</h1>
              <p className="text-sm opacity-90">{products?.length || 0} produtos disponíveis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productsWithPrice.map((product: any) => {
            const whatsappMsg = `Olá! Tenho interesse no produto: ${product.nome} - R$ ${product.finalPrice.toFixed(2)}`;
            const whatsappUrl = `https://wa.me/${reseller.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

            return (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square">
                  <Image
                    src={product.imagem_url || '/placeholder.png'}
                    alt={product.nome}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] text-sm">
                    {product.nome}
                  </h3>
                  <p className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    R$ {product.finalPrice.toFixed(2)}
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageCircle size={16} />
                    Comprar
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {productsWithPrice.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p> {new Date().getFullYear()} {reseller.store_name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}