"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Share2, ExternalLink, Package, Eye, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Reseller {
  id: string;
  name: string;
  store_name: string;
  slug: string;
  total_products: number;
  catalog_views: number;
}

export default function DashboardRevendedora() {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    console.log('🔄 Dashboard: Carregando dados...');
    try {
      const supabase = createClient();
      
      // Verificar usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário:', user?.id || 'NÃO LOGADO');
      
      if (!user) {
        console.log('❌ Sem usuário, redirecionando para login...');
        window.location.href = '/login/revendedora';
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

      console.log('✅ Revendedora encontrada:', data.name);
      setReseller(data);
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

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const catalogUrl = `${siteUrl}/catalogo/${reseller.slug}`;
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

      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Seu Catálogo Está Pronto!</h2>
        <p className="text-pink-100 mb-4">Compartilhe com suas clientes e comece a vender</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/catalogo/${reseller.slug}`} target="_blank" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-pink-600 font-medium rounded-lg hover:bg-pink-50 transition-all">
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Próximos Passos</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <p className="font-medium text-gray-900">Adicione produtos ao seu catálogo</p>
              <p className="text-sm text-gray-500">Vá em &quot;Produtos&quot; e ative os produtos que deseja vender</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <p className="font-medium text-gray-900">Personalize sua loja</p>
              <p className="text-sm text-gray-500">Adicione seu logo e escolha as cores da sua marca</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <p className="font-medium text-gray-900">Compartilhe seu catálogo</p>
              <p className="text-sm text-gray-500">Envie o link para suas clientes via WhatsApp ou redes sociais</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
