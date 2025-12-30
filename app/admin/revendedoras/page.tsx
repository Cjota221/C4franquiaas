"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Eye, Search, Store, Mail, Phone, Calendar, TrendingUp, Clock, MessageCircle } from 'lucide-react';

interface Revendedora {
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
  created_at: string;
  rejection_reason?: string;
}

export default function AdminRevendedoras() {
  const [revendedoras, setRevendedoras] = useState<Revendedora[]>([]);
  const [filtradas, setFiltradas] = useState<Revendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendente' | 'aprovada' | 'rejeitada'>('todas');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarRevendedoras();
  }, []);

  useEffect(() => {
    filtrarRevendedoras();
  }, [revendedoras, filtro, busca]);

  async function carregarRevendedoras() {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar revendedoras:', error);
        throw error;
      }

      console.log(' Revendedoras carregadas:', data);
      setRevendedoras(data || []);
    } catch (err) {
      console.error(' Erro ao carregar revendedoras:', err);
      alert('Erro ao carregar revendedoras. Verifique se a migration 033 foi aplicada.');
    } finally {
      setLoading(false);
    }
  }

  function filtrarRevendedoras() {
    let resultado = [...revendedoras];

    if (filtro !== 'todas') {
      resultado = resultado.filter(r => r.status === filtro);
    }

    if (busca) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(r =>
        r.name.toLowerCase().includes(termo) ||
        r.email.toLowerCase().includes(termo) ||
        r.store_name.toLowerCase().includes(termo)
      );
    }

    setFiltradas(resultado);
  }

  async function aprovar(id: string) {
    if (!confirm('Deseja aprovar esta revendedora? Ela receberá um email de notificação.')) return;

    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: id, action: 'aprovar' })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert(`✅ Revendedora aprovada com sucesso!${data.emailSent ? '\n📧 Email de notificação enviado!' : ''}`);
      carregarRevendedoras();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      alert('Erro ao aprovar revendedora');
    }
  }

  async function rejeitar(id: string) {
    const motivo = prompt('Motivo da rejeição (opcional):');
    if (motivo === null) return;

    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: id, action: 'rejeitar', motivo })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert(`❌ Revendedora rejeitada${data.emailSent ? '\n📧 Email de notificação enviado!' : ''}`);
      carregarRevendedoras();
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      alert('Erro ao rejeitar revendedora');
    }
  }

  async function toggleAtivo(id: string, ativoAtual: boolean) {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('resellers')
        .update({ is_active: !ativoAtual })
        .eq('id', id);

      if (error) throw error;

      alert(`Revendedora ${!ativoAtual ? 'ativada' : 'desativada'} com sucesso!`);
      carregarRevendedoras();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status');
    }
  }

  const stats = {
    total: revendedoras.length,
    pendentes: revendedoras.filter(r => r.status === 'pendente').length,
    aprovadas: revendedoras.filter(r => r.status === 'aprovada').length,
    rejeitadas: revendedoras.filter(r => r.status === 'rejeitada').length
  };

  // Função para enviar WhatsApp de boas-vindas
  function enviarWhatsAppBoasVindas(revendedora: Revendedora) {
    const telefone = revendedora.phone.replace(/\D/g, '');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://c4franquias.com';
    const loginUrl = `${baseUrl}/login/revendedora`;
    
    const mensagem = `Ola ${revendedora.name}!

Temos uma otima noticia! Seu cadastro como franqueada foi *APROVADO*!

Sua loja "${revendedora.store_name}" ja esta pronta para voce comecar a vender!

*Acesse sua conta:*
${loginUrl}

Use o email cadastrado: ${revendedora.email}

Qualquer duvida, estamos a disposicao!`;

    const urlWhatsApp = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#DB1472] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando revendedoras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
           Gerenciar Revendedoras
        </h1>
        <p className="text-gray-600">
          Aprove, rejeite ou gerencie as revendedoras cadastradas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Store className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm">Aprovadas</p>
              <p className="text-2xl font-bold text-green-900">{stats.aprovadas}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm">Rejeitadas</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejeitadas}</p>
            </div>
            <X className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {(['todas', 'pendente', 'aprovada', 'rejeitada'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFiltro(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtro === status
                    ? 'bg-[#DB1472] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou loja..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de Revendedoras */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nenhuma revendedora encontrada</p>
          <p className="text-gray-400 text-sm">
            {revendedoras.length === 0 
              ? 'Ainda não há revendedoras cadastradas. Aguarde os primeiros cadastros!' 
              : 'Tente ajustar os filtros ou a busca.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtradas.map(revendedora => (
            <div
              key={revendedora.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">
                      {revendedora.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      revendedora.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      revendedora.status === 'aprovada' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {revendedora.status.toUpperCase()}
                    </span>
                    {!revendedora.is_active && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        INATIVA
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span><strong>Loja:</strong> {revendedora.store_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{revendedora.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{revendedora.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Cadastro: {new Date(revendedora.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">
                        <strong>{revendedora.total_products}</strong> produtos
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">
                        <strong>{revendedora.catalog_views}</strong> visualizações
                      </span>
                    </div>
                  </div>

                  {revendedora.status === 'rejeitada' && revendedora.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Motivo da rejeição:</strong> {revendedora.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {revendedora.status === 'pendente' && (
                    <>
                      <button
                        onClick={() => aprovar(revendedora.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                      >
                        <Check className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejeitar(revendedora.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </>
                  )}

                  {revendedora.status === 'aprovada' && (
                    <>
                      <button
                        onClick={() => enviarWhatsAppBoasVindas(revendedora)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                        title="Enviar mensagem de boas-vindas via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => toggleAtivo(revendedora.id, revendedora.is_active)}
                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                          revendedora.is_active
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {revendedora.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </>
                  )}

                  {revendedora.status === 'rejeitada' && (
                    <button
                      onClick={() => aprovar(revendedora.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      Aprovar Agora
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
