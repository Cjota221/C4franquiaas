"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, MapPin, Store, Instagram, Lock, Check, Loader2 } from 'lucide-react';

// Etapas do cadastro
const ETAPAS = [
  { numero: 1, titulo: 'Dados Pessoais', icone: User },
  { numero: 2, titulo: 'Endereço', icone: MapPin },
  { numero: 3, titulo: 'Sobre a Loja', icone: Store },
  { numero: 4, titulo: 'Redes Sociais', icone: Instagram },
  { numero: 5, titulo: 'Acesso', icone: Lock },
];

const COMO_CONHECEU_OPTIONS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'Indicação de amiga',
  'Google',
  'Já comprei como cliente',
  'Outro'
];

const CANAL_VENDAS_OPTIONS = [
  'WhatsApp',
  'Instagram',
  'Loja física própria',
  'Salão de beleza',
  'Escritório/Trabalho',
  'Porta a porta',
  'Outro'
];

const EXPECTATIVA_VENDAS_OPTIONS = [
  'Até R$ 500/mês',
  'R$ 500 a R$ 1.000/mês',
  'R$ 1.000 a R$ 3.000/mês',
  'R$ 3.000 a R$ 5.000/mês',
  'Acima de R$ 5.000/mês'
];

export default function CadastroRevendedoraPage() {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');
  
  const [form, setForm] = useState({
    // Dados pessoais
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    // Endereço
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Sobre a loja
    nomeLoja: '',
    comoConheceu: '',
    temExperiencia: '',
    canalVendas: '',
    expectativaVendas: '',
    sobreMim: '',
    // Redes sociais
    instagram: '',
    facebook: '',
    // Acesso
    senha: '',
    confirmarSenha: '',
    aceitaTermos: false
  });

  // Máscara de telefone
  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }

  // Máscara de CPF
  function formatarCPF(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // Máscara de CEP
  function formatarCEP(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{0,3})/, '$1-$2').trim();
  }

  // Buscar CEP via ViaCEP
  async function buscarCEP(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCep(true);
    setErro('');
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      
      if (data.erro) {
        setErro('CEP não encontrado');
        return;
      }
      
      setForm(prev => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch {
      setErro('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  }

  // Validação de etapa
  function validarEtapa(): boolean {
    setErro('');
    
    switch (etapaAtual) {
      case 1: // Dados pessoais
        if (!form.nome || !form.email || !form.telefone || !form.cpf || !form.dataNascimento) {
          setErro('Preencha todos os campos obrigatórios');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setErro('Email inválido');
          return false;
        }
        return true;
        
      case 2: // Endereço
        if (!form.cep || !form.rua || !form.numero || !form.bairro || !form.cidade || !form.estado) {
          setErro('Preencha todos os campos obrigatórios do endereço');
          return false;
        }
        return true;
        
      case 3: // Sobre a loja
        if (!form.nomeLoja || !form.comoConheceu || !form.temExperiencia) {
          setErro('Preencha os campos obrigatórios');
          return false;
        }
        return true;
        
      case 4: // Redes sociais (opcional)
        return true;
        
      case 5: // Acesso
        if (form.senha.length < 6) {
          setErro('A senha deve ter no mínimo 6 caracteres');
          return false;
        }
        if (form.senha !== form.confirmarSenha) {
          setErro('As senhas não coincidem');
          return false;
        }
        if (!form.aceitaTermos) {
          setErro('Você precisa aceitar os termos para continuar');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  }

  function avancar() {
    if (validarEtapa() && etapaAtual < 5) {
      setEtapaAtual(etapaAtual + 1);
      setErro('');
    }
  }

  function voltar() {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
      setErro('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validarEtapa()) return;
    
    setLoading(true);
    setErro('');

    try {
      const res = await fetch('/api/cadastro/revendedora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cpf: form.cpf,
          dataNascimento: form.dataNascimento,
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          nomeLoja: form.nomeLoja,
          cidade: form.cidade,
          estado: form.estado,
          comoConheceu: form.comoConheceu,
          temExperiencia: form.temExperiencia === 'sim',
          canalVendas: form.canalVendas,
          expectativaVendas: form.expectativaVendas,
          sobreMim: form.sobreMim,
          instagram: form.instagram,
          facebook: form.facebook,
          senha: form.senha
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao cadastrar');
      }

      setSucesso(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      console.error('Erro ao cadastrar:', err);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
          <p className="text-gray-600 mb-6">
            Sua solicitação foi enviada com sucesso. Aguarde a análise do administrador.
            Você receberá um aviso assim que sua conta for aprovada.
          </p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-700">
              <strong>📧 Email cadastrado:</strong><br />
              {form.email}
            </p>
          </div>
          <Link
            href="/login/revendedora"
            className="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  // Componente de etapas
  const EtapaIndicador = () => (
    <div className="flex justify-between mb-6">
      {ETAPAS.map((etapa) => {
        const Icon = etapa.icone;
        const isAtiva = etapaAtual === etapa.numero;
        const isCompleta = etapaAtual > etapa.numero;
        
        return (
          <div key={etapa.numero} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
              isAtiva ? 'bg-purple-600 text-white' :
              isCompleta ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {isCompleta ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs text-center ${isAtiva ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
              {etapa.titulo}
            </span>
            {etapa.numero < 5 && (
              <div className={`hidden sm:block absolute h-0.5 w-full max-w-[50px] top-5 left-1/2 ${
                isCompleta ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-3">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Seja uma Revendedora</h1>
          <p className="text-gray-500 text-sm mt-1">
            Etapa {etapaAtual} de 5 - {ETAPAS[etapaAtual - 1].titulo}
          </p>
        </div>

        {/* Indicador de etapas */}
        <EtapaIndicador />

        {/* Erro */}
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ETAPA 1: Dados Pessoais */}
          {etapaAtual === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Maria Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="seuemail@exemplo.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    type="tel"
                    required
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* ETAPA 2: Endereço */}
          {etapaAtual === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.cep}
                    onChange={(e) => {
                      const cep = formatarCEP(e.target.value);
                      setForm({ ...form, cep });
                      if (cep.replace(/\D/g, '').length === 8) {
                        buscarCEP(cep);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {buscandoCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                <input
                  type="text"
                  required
                  value={form.rua}
                  onChange={(e) => setForm({ ...form, rua: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nome da rua"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={form.complemento}
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Apto 101"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                <input
                  type="text"
                  required
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Centro"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                    placeholder="SP"
                  />
                </div>
              </div>
            </>
          )}

          {/* ETAPA 3: Sobre a Loja */}
          {etapaAtual === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da sua Loja *</label>
                <input
                  type="text"
                  required
                  value={form.nomeLoja}
                  onChange={(e) => setForm({ ...form, nomeLoja: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Beleza da Maria"
                />
                <p className="text-xs text-gray-500 mt-1">Este nome aparecerá no seu catálogo</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Como conheceu a marca? *</label>
                <select
                  required
                  value={form.comoConheceu}
                  onChange={(e) => setForm({ ...form, comoConheceu: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {COMO_CONHECEU_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tem experiência com vendas? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="experiencia"
                      value="sim"
                      checked={form.temExperiencia === 'sim'}
                      onChange={(e) => setForm({ ...form, temExperiencia: e.target.value })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="experiencia"
                      value="nao"
                      checked={form.temExperiencia === 'nao'}
                      onChange={(e) => setForm({ ...form, temExperiencia: e.target.value })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span>Não, será minha primeira vez</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal canal de vendas</label>
                <select
                  value={form.canalVendas}
                  onChange={(e) => setForm({ ...form, canalVendas: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {CANAL_VENDAS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expectativa de vendas mensais</label>
                <select
                  value={form.expectativaVendas}
                  onChange={(e) => setForm({ ...form, expectativaVendas: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {EXPECTATIVA_VENDAS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conte um pouco sobre você</label>
                <textarea
                  value={form.sobreMim}
                  onChange={(e) => setForm({ ...form, sobreMim: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Fale sobre sua experiência, motivação para revender, público que atende..."
                />
              </div>
            </>
          )}

          {/* ETAPA 4: Redes Sociais */}
          {etapaAtual === 4 && (
            <>
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-purple-700">
                  <strong>📱 Opcional:</strong> Adicione suas redes sociais para divulgar seus produtos e aumentar suas vendas!
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value.replace('@', '') })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="seu_instagram"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="text"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Link do seu perfil ou página"
                />
              </div>
            </>
          )}

          {/* ETAPA 5: Acesso */}
          {etapaAtual === 5 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmarSenha}
                  onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite a senha novamente"
                />
                {form.confirmarSenha && form.senha !== form.confirmarSenha && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📋 Resumo do Cadastro</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nome:</strong> {form.nome}</p>
                  <p><strong>Email:</strong> {form.email}</p>
                  <p><strong>Loja:</strong> {form.nomeLoja}</p>
                  <p><strong>Cidade:</strong> {form.cidade}/{form.estado}</p>
                </div>
              </div>
              
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.aceitaTermos}
                  onChange={(e) => setForm({ ...form, aceitaTermos: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-600">
                  Li e aceito os <Link href="/termos" target="_blank" className="text-purple-600 hover:underline">termos de uso</Link> e a{' '}
                  <Link href="/privacidade" target="_blank" className="text-purple-600 hover:underline">política de privacidade</Link> *
                </span>
              </label>
            </>
          )}

          {/* Botões de navegação */}
          <div className="flex gap-3 pt-2">
            {etapaAtual > 1 && (
              <button
                type="button"
                onClick={voltar}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            
            {etapaAtual < 5 ? (
              <button
                type="button"
                onClick={avancar}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-600 transition flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !form.aceitaTermos}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Finalizar Cadastro
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-center text-sm text-gray-500">
            Já tem cadastro?{' '}
            <Link href="/login/revendedora" className="text-purple-600 hover:underline font-medium">
              Fazer login
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            <Link href="/" className="text-gray-600 hover:underline">
              ← Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
