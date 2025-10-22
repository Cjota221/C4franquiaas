"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const carregarPerfil = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
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
  }, [supabase]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!franqueada) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erro ao carregar perfil
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">👤 Meu Perfil</h1>
        <p className="text-gray-600">Informações da sua conta</p>
      </div>

      {/* Card de Perfil */}
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        {/* Avatar e Nome */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-pink-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{franqueada.nome}</h2>
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${
                franqueada.status === 'aprovada' ? 'text-green-600' :
                franqueada.status === 'pendente' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {franqueada.status === 'aprovada' ? 'Aprovada' :
                 franqueada.status === 'pendente' ? 'Pendente' :
                 'Rejeitada'}
              </span>
            </p>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-800">{franqueada.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium text-gray-800">{franqueada.telefone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">CPF</p>
              <p className="font-medium text-gray-800">{franqueada.cpf}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Localização</p>
              <p className="font-medium text-gray-800">
                {franqueada.cidade}, {franqueada.estado}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Membro desde</p>
              <p className="font-medium text-gray-800">
                {new Date(franqueada.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {franqueada.aprovado_em && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Aprovado em</p>
                <p className="font-medium text-gray-800">
                  {new Date(franqueada.aprovado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {franqueada.ultimo_acesso && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Último acesso</p>
                <p className="font-medium text-gray-800">
                  {new Date(franqueada.ultimo_acesso).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(franqueada.ultimo_acesso).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Editar Perfil (Em breve)
          </button>
        </div>
      </div>
    </div>
  );
}
