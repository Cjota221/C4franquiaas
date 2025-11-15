'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validarChavePix, formatarChavePix } from '@/lib/pix';
import type { TipoChavePix, DadosPagamentoPix } from '@/types/financeiro';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function FormDadosPagamento() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [dadosExistentes, setDadosExistentes] = useState<DadosPagamentoPix | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [formData, setFormData] = useState({
    tipo_chave_pix: 'CPF' as TipoChavePix,
    chave_pix: '',
    nome_completo: '',
    cidade: 'Sao Paulo'
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  // Carregar dados existentes
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('franqueadas_dados_pagamento')
        .select('*')
        .eq('franqueada_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar dados PIX:', error);
        return;
      }

      if (data) {
        setDadosExistentes(data);
        setFormData({
          tipo_chave_pix: data.tipo_chave_pix,
          chave_pix: data.chave_pix,
          nome_completo: data.nome_completo,
          cidade: data.cidade || 'Sao Paulo'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function validarFormulario(): boolean {
    const novosErros: Record<string, string> = {};

    if (!formData.chave_pix.trim()) {
      novosErros.chave_pix = 'Chave PIX Ã© obrigatÃ³ria';
    } else if (!validarChavePix(formData.chave_pix, formData.tipo_chave_pix)) {
      novosErros.chave_pix = `Formato invÃ¡lido para ${formData.tipo_chave_pix}`;
    }

    if (!formData.nome_completo.trim()) {
      novosErros.nome_completo = 'Nome completo Ã© obrigatÃ³rio';
    } else if (formData.nome_completo.length < 3) {
      novosErros.nome_completo = 'Nome muito curto';
    }

    if (!formData.cidade.trim()) {
      novosErros.cidade = 'Cidade Ã© obrigatÃ³ria';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validarFormulario()) {
      setMensagem({ tipo: 'error', texto: 'Corrija os erros antes de salvar' });
      return;
    }

    try {
      setSalvando(true);
      setMensagem(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('UsuÃ¡rio nÃ£o autenticado');

      const dadosSalvar = {
        franqueada_id: user.id,
        ...formData
      };

      let error;

      if (dadosExistentes) {
        // UPDATE
        const result = await supabase
          .from('franqueadas_dados_pagamento')
          .update(dadosSalvar)
          .eq('franqueada_id', user.id);
        error = result.error;
      } else {
        // INSERT
        const result = await supabase
          .from('franqueadas_dados_pagamento')
          .insert([dadosSalvar]);
        error = result.error;
      }

      if (error) throw error;

      setMensagem({ 
        tipo: 'success', 
        texto: dadosExistentes ? 'Dados atualizados com sucesso!' : 'Dados salvos com sucesso!' 
      });
      
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar dados PIX:', error);
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  }

  const placeholders: Record<TipoChavePix, string> = {
    CPF: '12345678900',
    CNPJ: '12345678000199',
    EMAIL: 'seuemail@exemplo.com',
    CELULAR: '+5511999999999',
    ALEATORIA: '123e4567-e89b-12d3-a456-426614174000'
  };

  const descricoes: Record<TipoChavePix, string> = {
    CPF: 'Digite apenas nÃºmeros (11 dÃ­gitos)',
    CNPJ: 'Digite apenas nÃºmeros (14 dÃ­gitos)',
    EMAIL: 'Digite um email vÃ¡lido',
    CELULAR: 'Formato: +55 11 99999-9999',
    ALEATORIA: 'Cole a chave aleatÃ³ria completa'
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Carregando...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Dados de Recebimento PIX</h2>
        <p className="text-gray-600">
          Configure sua chave PIX para receber as comissÃµes das vendas.
        </p>
      </div>

      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          mensagem.tipo === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensagem.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Chave PIX */}
        <div>
          <Label htmlFor="tipo_chave">Tipo de Chave PIX *</Label>
          <Select
            value={formData.tipo_chave_pix}
            onValueChange={(value) => {
              setFormData({ ...formData, tipo_chave_pix: value as TipoChavePix, chave_pix: '' });
              setErros({ ...erros, chave_pix: '' });
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPF">CPF</SelectItem>
              <SelectItem value="CNPJ">CNPJ</SelectItem>
              <SelectItem value="EMAIL">E-mail</SelectItem>
              <SelectItem value="CELULAR">Celular</SelectItem>
              <SelectItem value="ALEATORIA">Chave AleatÃ³ria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chave PIX */}
        <div>
          <Label htmlFor="chave_pix">Chave PIX *</Label>
          <Input
            id="chave_pix"
            type="text"
            value={formData.chave_pix}
            onChange={(e) => {
              setFormData({ ...formData, chave_pix: e.target.value });
              setErros({ ...erros, chave_pix: '' });
            }}
            placeholder={placeholders[formData.tipo_chave_pix]}
            className={`mt-2 ${erros.chave_pix ? 'border-red-500' : ''}`}
          />
          <p className="text-sm text-gray-500 mt-1">{descricoes[formData.tipo_chave_pix]}</p>
          {erros.chave_pix && <p className="text-sm text-red-500 mt-1">{erros.chave_pix}</p>}
          
          {formData.chave_pix && !erros.chave_pix && validarChavePix(formData.chave_pix, formData.tipo_chave_pix) && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Chave vÃ¡lida: {formatarChavePix(formData.chave_pix, formData.tipo_chave_pix)}
            </p>
          )}
        </div>

        {/* Nome Completo */}
        <div>
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            type="text"
            value={formData.nome_completo}
            onChange={(e) => {
              setFormData({ ...formData, nome_completo: e.target.value });
              setErros({ ...erros, nome_completo: '' });
            }}
            placeholder="Seu nome completo"
            className={`mt-2 ${erros.nome_completo ? 'border-red-500' : ''}`}
            maxLength={25}
          />
          <p className="text-sm text-gray-500 mt-1">
            Esse nome aparecerÃ¡ no PIX para quem for pagar ({formData.nome_completo.length}/25)
          </p>
          {erros.nome_completo && <p className="text-sm text-red-500 mt-1">{erros.nome_completo}</p>}
        </div>

        {/* Cidade */}
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            type="text"
            value={formData.cidade}
            onChange={(e) => {
              setFormData({ ...formData, cidade: e.target.value });
              setErros({ ...erros, cidade: '' });
            }}
            placeholder="Sao Paulo"
            className={`mt-2 ${erros.cidade ? 'border-red-500' : ''}`}
            maxLength={15}
          />
          <p className="text-sm text-gray-500 mt-1">
            MÃ¡ximo 15 caracteres ({formData.cidade.length}/15)
          </p>
          {erros.cidade && <p className="text-sm text-red-500 mt-1">{erros.cidade}</p>}
        </div>

        {/* BotÃ£o Salvar */}
        <div className="flex gap-3">
          <Button type="submit" disabled={salvando} className="flex-1">
            {salvando ? 'Salvando...' : dadosExistentes ? 'Atualizar Dados' : 'Salvar Dados'}
          </Button>
        </div>
      </form>

      {dadosExistentes && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>âœ… Seus dados PIX estÃ£o configurados!</strong><br />
            VocÃª receberÃ¡ as comissÃµes nesta chave PIX.
          </p>
        </div>
      )}
    </Card>
  );
}
