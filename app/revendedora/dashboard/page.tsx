"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Share2, ExternalLink, Package, Eye, TrendingUp, Loader2, Palette, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Reseller {
  id: string;
  name: string;
  store_name: string;
  slug: string;
  total_products: number;
  catalog_views: number;
}

interface NewProductsAlert {
  count: number;
  latestProducts: {
    id: string;
    nome: string;
    created_at: string;
  }[];
}

export default function DashboardRevendedora() {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProductsAlert, setNewProductsAlert] = useState<NewProductsAlert | null>(null);

  const carregarDados = useCallback(async () => {
    console.log('🔄 Dashboard: Carregando dados...');
    try {
      const supabase = createClient();
      
      // Verificar usuário logado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Usuário:', user?.id || 'NÃO LOGADO', 'Erro:', userError?.message);
      
      if (!user) {
        console.log('❌ Sem usuário logado');
        setError('Você precisa estar logado para acessar esta página.');
        setLoading(false);
        return;
      }

      // Buscar revendedora
      console.log('🔍 Buscando revendedora com user_id:', user.id);
      const { data, error: resellerError } = await supabase
        .from('resellers')
        .select('id, name, store_name, slug, total_products, catalog_views')
        .eq('user_id', user.id)
        .single();

      console.log('📦 Resultado:', { data, error: resellerError });

      if (resellerError) {
        console.error('❌ Erro ao buscar revendedora:', resellerError);
        setError('Erro ao carregar dados da revendedora: ' + resellerError.message);
        return;
      }

      if (!data) {
        setError('Revendedora não encontrada. Seu cadastro pode estar pendente de aprovação.');
        return;
      }

      console.log('✅ Revendedora encontrada:', data.name, '| Slug:', data.slug || 'NÃO CONFIGURADO');
      setReseller(data);

      // 🆕 Verificar PRODUTOS NOVOS PENDENTES (desativados + margem zero)
      const { data: newProducts, error: newProdError } = await supabase
        .from('reseller_products')
        .select(`
          product_id,
          created_at,
          margin_percent,
          is_active,
          produtos:product_id (
            id,
            nome
          )
        `)
        .eq('reseller_id', data.id)
        .eq('is_active', false)  // 🆕 DESATIVADOS
        .eq('margin_percent', 0)  // 🆕 SEM MARGEM DEFINIDA
        .order('created_at', { ascending: false })
        .limit(5);

      if (newProdError) {
        console.error('⚠️ Erro ao buscar produtos novos:', newProdError);
      } else if (newProducts && newProducts.length > 0) {
        console.log(`✅ ${newProducts.length} produtos novos pendentes encontrados`);
        setNewProductsAlert({
          count: newProducts.length,
          latestProducts: newProducts.map((np) => {
            const prod = np.produtos as unknown as { id: string; nome: string } | null;
            return {
              id: prod?.id || '',
              nome: prod?.nome || 'Produto',
              created_at: np.created_at
            };
          })
        });
      }
    } catch (err) {
      console.error('❌ Erro geral:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !reseller) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">{error || 'Revendedora não encontrada'}</p>
        <p className="text-gray-500 mt-2">Seu cadastro pode ainda estar pendente de aprovação.</p>
        <Link href="/login/revendedora" className="mt-4 inline-block text-purple-600 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  // Verificar se a revendedora já configurou sua loja (tem slug)
  const hasConfiguredStore = Boolean(reseller.slug && reseller.slug.trim() !== '');

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const catalogUrl = hasConfiguredStore ? `${siteUrl}/catalogo/${reseller.slug}` : '';
  const whatsappShareText = `Confira meu catálogo de produtos: ${catalogUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const metrics = [
    { label: 'Produtos Ativos', value: reseller.total_products || 0, icon: Package, color: 'text-blue-600' },
    { label: 'Visualizações', value: reseller.catalog_views || 0, icon: Eye, color: 'text-green-600' },
    { label: 'Taxa Conversão', value: '0%', icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Olá, {reseller.name}! Veja suas estatísticas.</p>
      </div>

      {/* 🆕 Alerta de Produtos Novos PENDENTES */}
      {newProductsAlert && newProductsAlert.count > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-6 text-white shadow-xl border-2 border-amber-300 animate-pulse-slow">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/30 rounded-xl">
              <Package className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                💰 {newProductsAlert.count} {newProductsAlert.count === 1 ? 'Produto Aguardando Ativação' : 'Produtos Aguardando Ativação'}!
              </h2>
              <p className="text-white/90 font-medium mb-3 text-lg">
                {newProductsAlert.count === 1 
                  ? '⚠️ Você tem 1 produto novo! Defina sua margem de lucro e ative para começar a vender.' 
                  : `⚠️ Você tem ${newProductsAlert.count} produtos novos! Defina sua margem de lucro e ative para começar a vender.`}
              </p>
              
              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-white/90 mb-2 font-semibold">
                  📝 Primeiros produtos exibidos:
                </p>
                {newProductsAlert.latestProducts.slice(0, 3).map((prod) => (
                  <div key={prod.id} className="text-sm text-white mb-1 flex items-center gap-2">
                    <span className="text-amber-200">▸</span> {prod.nome}
                  </div>
                ))}
                {newProductsAlert.count > 3 && (
                  <div className="text-sm text-white/90 mt-2 font-medium">
                    ... e mais {newProductsAlert.count - 3} produto{newProductsAlert.count - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              <Link 
                href="/revendedora/produtos/novos" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-lg hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Sparkles size={22} />
                Definir Margens e Ativar Produtos
                <ArrowRight size={22} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-50`}>
                  <Icon size={24} className={metric.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Se JÁ configurou a loja - Mostra o catálogo pronto */}
      {hasConfiguredStore ? (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">🎉 Seu Catálogo Está Pronto!</h2>
          <p className="text-pink-100 mb-4">Compartilhe com suas clientes e comece a vender</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={catalogUrl} target="_blank" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-pink-600 font-medium rounded-lg hover:bg-pink-50 transition-all">
              <ExternalLink size={18} />
              Ver Catálogo
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 backdrop-blur text-white font-medium rounded-lg hover:bg-white/30 transition-all">
              <Share2 size={18} />
              Compartilhar no WhatsApp
            </a>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm text-pink-100 mb-1">Link do seu catálogo:</p>
            <code className="text-sm font-mono bg-black/20 px-3 py-1 rounded block overflow-x-auto">{catalogUrl}</code>
          </div>
        </div>
      ) : (
        /* Se AINDA NÃO configurou - Mostra orientação para personalizar */
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Configure seu Catálogo!</h2>
              <p className="text-amber-100 mb-4">
                Para começar a vender, você precisa personalizar sua loja. 
                Defina o nome da sua loja, escolha suas cores e adicione seu logo.
              </p>
              <Link 
                href="/revendedora/personalizacao" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-all"
              >
                <Palette size={18} />
                Personalizar Minha Loja
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Próximos Passos</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${hasConfiguredStore ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600'}`}>
              {hasConfiguredStore ? '✓' : '1'}
            </span>
            <div>
              <p className={`font-medium ${hasConfiguredStore ? 'text-green-700' : 'text-gray-900'}`}>
                {hasConfiguredStore ? 'Loja personalizada!' : 'Personalize sua loja'}
              </p>
              <p className="text-sm text-gray-500">
                {hasConfiguredStore 
                  ? `Sua loja "${reseller.store_name}" está configurada` 
                  : 'Defina o nome da loja, logo e cores da sua marca'}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <p className="font-medium text-gray-900">Adicione produtos ao seu catálogo</p>
              <p className="text-sm text-gray-500">Vá em &quot;Produtos&quot; e ative os produtos que deseja vender</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${hasConfiguredStore ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'}`}>3</span>
            <div>
              <p className={`font-medium ${hasConfiguredStore ? 'text-gray-900' : 'text-gray-400'}`}>Compartilhe seu catálogo</p>
              <p className={`text-sm ${hasConfiguredStore ? 'text-gray-500' : 'text-gray-400'}`}>
                {hasConfiguredStore 
                  ? 'Envie o link para suas clientes via WhatsApp ou redes sociais'
                  : 'Disponível após personalizar sua loja'}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
