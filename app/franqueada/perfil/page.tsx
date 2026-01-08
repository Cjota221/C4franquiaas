"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, Wallet } from 'lucide-react';
import { FormDadosPagamento } from '@/components/franqueada/FormDadosPagamento';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Franqueada = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string;
  estado: string;
  status: string;
  criado_em: string;
  aprovado_em: string | null;
  ultimo_acesso: string | null;
};

export default function FranqueadaPerfilPage() {
  const [franqueada, setFranqueada] = useState<Franqueada | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async () => {
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;

      const { data, error } = await createClient()
        .from('franqueadas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return;
      }

      setFranqueada(data);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <LoadingState message="Carregando perfil..." />
      </div>
    );
  }

  if (!franqueada) {
    return (
      <div className="p-4 md:p-6">
        <Card className="bg-red-50 border-red-200 p-4 text-red-700">
          Erro ao carregar perfil
        </Card>
      </div>
    );
  }

  const getStatusType = (status: string) => {
    switch (status) {
      case 'aprovada': return 'active';
      case 'pendente': return 'pending';
      default: return 'error';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada';
      case 'pendente': return 'Pendente';
      default: return 'Rejeitada';
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Cabecalho */}
      <PageHeader
        title="Meu Perfil"
        subtitle="Informacoes da sua conta"
        icon={User}
      />

      {/* Card de Perfil */}
      <Card className="p-6 max-w-2xl">
        {/* Avatar e Nome */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-pink-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{franqueada.nome}</h2>
            <div className="mt-1">
              <StatusBadge 
                status={getStatusType(franqueada.status) as 'active' | 'pending' | 'error'} 
                label={getStatusLabel(franqueada.status)} 
              />
            </div>
          </div>
        </div>

        {/* Informacoes Pessoais */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{franqueada.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium text-gray-900">{franqueada.telefone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">CPF</p>
              <p className="font-medium text-gray-900">{franqueada.cpf}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Localizacao</p>
              <p className="font-medium text-gray-900">
                {franqueada.cidade}, {franqueada.estado}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Membro desde</p>
              <p className="font-medium text-gray-900">
                {new Date(franqueada.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {franqueada.aprovado_em && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Aprovado em</p>
                <p className="font-medium text-gray-900">
                  {new Date(franqueada.aprovado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {franqueada.ultimo_acesso && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Ultimo acesso</p>
                <p className="font-medium text-gray-900">
                  {new Date(franqueada.ultimo_acesso).toLocaleDateString('pt-BR')} as{' '}
                  {new Date(franqueada.ultimo_acesso).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acoes */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm"
          >
            Editar Perfil (Em breve)
          </button>
        </div>
      </Card>

      {/* Dados de Pagamento PIX */}
      <div className="mt-8 max-w-2xl">
        <SectionHeader
          title="Dados de Recebimento"
          icon={Wallet}
        />
        <Card className="p-0">
          <FormDadosPagamento />
        </Card>
      </div>
    </div>
  );
}
