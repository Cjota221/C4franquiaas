"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Store, Mail, Phone, Calendar, Eye, Package, 
  ExternalLink, CheckCircle, XCircle, MessageCircle, Ban
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface RevendedoraDetalhes {
  id: string;
  name: string;
  email: string;
  phone: string;
  store_name: string;
  slug: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  is_active: boolean;
  total_products: number;
  catalog_views: number;
  bio: string | null;
  logo_url: string | null;
  banner_url: string | null;
  instagram: string | null;
  facebook: string | null;
  created_at: string;
  colors: { primary: string; secondary: string } | null;
  // Dados pessoais completos
  cpf: string | null;
  birth_date: string | null;
  // Endereço completo
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  // Dados do cadastro
  how_did_you_find_us: string | null;
  has_experience_selling: boolean | null;
  main_sales_channel: string | null;
  expected_monthly_sales: string | null;
  rejection_reason: string | null;
}

interface Produto {
  id: string;
  nome: string;
  preco_base: number;
  imagem: string | null;
  margin_percent: number;
  is_active: boolean;
  preco_final: number;
}

export default function RevendedoraDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const revendedoraId = params.id as string;

  const [revendedora, setRevendedora] = useState<RevendedoraDetalhes | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'produtos'>('info');

  useEffect(() => {
    async function carregarDados() {
      try {
        const supabase = createClient();

        // Buscar revendedora
        const { data: revendedoraData, error: revendedoraError } = await supabase
          .from('resellers')
        .select('*')
        .eq('id', revendedoraId)
        .single();

      if (revendedoraError) throw revendedoraError;
      setRevendedora(revendedoraData);

      // Buscar produtos
      const { data: produtosData } = await supabase
        .from('reseller_products')
        .select(`
          margin_percent,
          is_active,
          produtos:product_id (
            id,
            nome,
            preco_base,
            imagem
          )
        `)
        .eq('reseller_id', revendedoraId)
        .limit(20);

      if (produtosData) {
        const produtosComPreco = produtosData.map((p) => {
          const prod = p.produtos as unknown as { id: string; nome: string; preco_base: number; imagem: string | null };
          const precoFinal = prod.preco_base * (1 + p.margin_percent / 100);
          return {
            id: prod.id,
            nome: prod.nome,
            preco_base: prod.preco_base,
            imagem: prod.imagem,
            margin_percent: p.margin_percent,
            is_active: p.is_active,
            preco_final: precoFinal
          };
        });
        setProdutos(produtosComPreco);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
    }
    
    carregarDados();
  }, [revendedoraId]);

  async function toggleAtivo() {
    if (!revendedora) return;
    
    const supabase = createClient();
    const novoStatus = !revendedora.is_active;
    
    const { error } = await supabase
      .from('resellers')
      .update({ is_active: novoStatus })
      .eq('id', revendedoraId);

    if (error) {
      alert('Erro ao atualizar status');
    } else {
      alert(`Revendedora ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`);
      // Recarregar a página
      window.location.reload();
    }
  }

  function enviarWhatsApp() {
    if (!revendedora) return;
    const telefone = revendedora.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefone}`, '_blank');
  }

  function verCatalogo() {
    if (!revendedora?.slug) {
      alert('Esta revendedora ainda não configurou o catálogo');
      return;
    }
    const catalogUrl = `${window.location.origin}/catalogo/${revendedora.slug}`;
    window.open(catalogUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!revendedora) {
    return (
      <div className="p-6">
        <p className="text-red-600">Revendedora não encontrada</p>
        <Link href="/admin/revendedoras" className="text-blue-600 hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const catalogUrl = revendedora.slug ? `${window.location.origin}/catalogo/${revendedora.slug}` : null;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/revendedoras')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {revendedora.logo_url ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={revendedora.logo_url}
                  alt={revendedora.store_name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                <Store className="w-10 h-10 text-gray-400" />
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{revendedora.store_name}</h1>
              <p className="text-gray-600 mt-1">{revendedora.name}</p>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    revendedora.status === 'aprovada'
                      ? 'bg-green-100 text-green-800'
                      : revendedora.status === 'pendente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {revendedora.status.toUpperCase()}
                </span>
                {!revendedora.is_active && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    INATIVA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {catalogUrl && (
              <button
                onClick={verCatalogo}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Catálogo
              </button>
            )}
            <button
              onClick={enviarWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={toggleAtivo}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                revendedora.is_active
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {revendedora.is_active ? (
                <>
                  <Ban className="w-4 h-4" />
                  Desativar
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Ativar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produtos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{revendedora.total_products}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{revendedora.catalog_views}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Cadastro</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(revendedora.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'produtos'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Produtos ({produtos.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-pink-600" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nome Completo</label>
                    <p className="text-gray-900 font-medium">{revendedora.name}</p>
                  </div>
                  {revendedora.cpf && (
                    <div>
                      <label className="text-sm text-gray-600">CPF</label>
                      <p className="text-gray-900 font-medium">{revendedora.cpf}</p>
                    </div>
                  )}
                  {revendedora.birth_date && (
                    <div>
                      <label className="text-sm text-gray-600">Data de Nascimento</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(revendedora.birth_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-pink-600" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900 font-medium">{revendedora.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Telefone</label>
                    <p className="text-gray-900 font-medium">{revendedora.phone}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {(revendedora.cep || revendedora.street) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-pink-600" />
                    Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {revendedora.cep && (
                      <div>
                        <label className="text-sm text-gray-600">CEP</label>
                        <p className="text-gray-900 font-medium">{revendedora.cep}</p>
                      </div>
                    )}
                    {revendedora.street && (
                      <div>
                        <label className="text-sm text-gray-600">Rua</label>
                        <p className="text-gray-900 font-medium">{revendedora.street}</p>
                      </div>
                    )}
                    {revendedora.number && (
                      <div>
                        <label className="text-sm text-gray-600">Número</label>
                        <p className="text-gray-900 font-medium">{revendedora.number}</p>
                      </div>
                    )}
                    {revendedora.complement && (
                      <div>
                        <label className="text-sm text-gray-600">Complemento</label>
                        <p className="text-gray-900 font-medium">{revendedora.complement}</p>
                      </div>
                    )}
                    {revendedora.neighborhood && (
                      <div>
                        <label className="text-sm text-gray-600">Bairro</label>
                        <p className="text-gray-900 font-medium">{revendedora.neighborhood}</p>
                      </div>
                    )}
                    {revendedora.city && (
                      <div>
                        <label className="text-sm text-gray-600">Cidade</label>
                        <p className="text-gray-900 font-medium">{revendedora.city}</p>
                      </div>
                    )}
                    {revendedora.state && (
                      <div>
                        <label className="text-sm text-gray-600">Estado</label>
                        <p className="text-gray-900 font-medium">{revendedora.state}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sobre a Loja */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-pink-600" />
                  Sobre a Loja
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nome da Loja</label>
                    <p className="text-gray-900 font-medium">{revendedora.store_name}</p>
                  </div>
                  {revendedora.how_did_you_find_us && (
                    <div>
                      <label className="text-sm text-gray-600">Como Conheceu</label>
                      <p className="text-gray-900 font-medium">{revendedora.how_did_you_find_us}</p>
                    </div>
                  )}
                  {revendedora.has_experience_selling !== null && (
                    <div>
                      <label className="text-sm text-gray-600">Tem Experiência</label>
                      <p className="text-gray-900 font-medium">
                        {revendedora.has_experience_selling ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  )}
                  {revendedora.main_sales_channel && (
                    <div>
                      <label className="text-sm text-gray-600">Canais de Venda</label>
                      <p className="text-gray-900 font-medium">{revendedora.main_sales_channel}</p>
                    </div>
                  )}
                  {revendedora.expected_monthly_sales && (
                    <div>
                      <label className="text-sm text-gray-600">Expectativa de Vendas</label>
                      <p className="text-gray-900 font-medium">{revendedora.expected_monthly_sales}</p>
                    </div>
                  )}
                </div>
                {revendedora.bio && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600">Sobre Mim</label>
                    <p className="text-gray-900 mt-1">{revendedora.bio}</p>
                  </div>
                )}
              </div>

              {/* Redes Sociais */}
              {(revendedora.instagram || revendedora.facebook) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Redes Sociais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {revendedora.instagram && (
                      <div>
                        <label className="text-sm text-gray-600">Instagram</label>
                        <a
                          href={`https://instagram.com/${revendedora.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          @{revendedora.instagram}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {revendedora.facebook && (
                      <div>
                        <label className="text-sm text-gray-600">Facebook</label>
                        <a
                          href={revendedora.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          Ver perfil
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Link do Catálogo */}
              {catalogUrl && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Link do Catálogo Público</h3>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700 flex-1 break-all">{catalogUrl}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(catalogUrl);
                        alert('Link copiado!');
                      }}
                      className="px-3 py-2 bg-pink-600 text-white text-sm rounded hover:bg-pink-700 transition-colors whitespace-nowrap"
                    >
                      Copiar Link
                    </button>
                  </div>
                </div>
              )}

              {/* Motivo da Rejeição (se aplicável) */}
              {revendedora.status === 'rejeitada' && revendedora.rejection_reason && (
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">Motivo da Rejeição</h3>
                  <p className="text-red-800">{revendedora.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Produtos */}
          {activeTab === 'produtos' && (
            <div>
              {produtos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum produto vinculado</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className={`border rounded-lg p-4 ${
                        produto.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
                      }`}
                    >
                      {produto.imagem && (
                        <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={produto.imagem}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <h4 className="font-medium text-gray-900 mb-2">{produto.nome}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-gray-600">
                            Base: R$ {produto.preco_base.toFixed(2)}
                          </p>
                          <p className="text-green-600 font-semibold">
                            Venda: R$ {produto.preco_final.toFixed(2)}
                          </p>
                          <p className="text-blue-600 text-xs">
                            +{produto.margin_percent}% margem
                          </p>
                        </div>
                        <div>
                          {produto.is_active ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}