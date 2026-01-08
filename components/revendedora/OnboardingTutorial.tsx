'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Package, 
  Palette, 
  Share2, 
  CheckCircle,
  Sparkles,
  PartyPopper
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  titulo: string;
  descricao: string;
  detalhe: string;
  icone: React.ReactNode;
  rota: string;
  acao?: string;
}

const PASSOS: OnboardingStep[] = [
  {
    id: 1,
    titulo: '1º Passo: Ative seus Produtos',
    descricao: 'Adicione margem de lucro nos produtos que você quer vender',
    detalhe: `👉 Selecione os produtos que deseja vender
👉 Defina sua margem de lucro (% ou R$)
👉 Clique em "Salvar" e pronto!

💡 Dica: Você pode selecionar todos e aplicar a mesma margem de uma vez!`,
    icone: <Package className="w-8 h-8" />,
    rota: '/revendedora/produtos',
    acao: 'Ir para Produtos'
  },
  {
    id: 2,
    titulo: '2º Passo: Personalize sua Loja',
    descricao: 'Deixe sua loja com a sua cara!',
    detalhe: `👉 Faça upload da sua logo
👉 Escolha as cores da sua marca
👉 Adicione um banner bonito

💡 Dica: Uma loja personalizada transmite mais confiança!`,
    icone: <Palette className="w-8 h-8" />,
    rota: '/revendedora/personalizacao',
    acao: 'Ir para Personalização'
  },
  {
    id: 3,
    titulo: '3º Passo: Compartilhe!',
    descricao: 'Pronto! Agora é só divulgar sua loja',
    detalhe: `👉 Copie o link da sua loja
👉 Compartilhe no WhatsApp, Instagram, Facebook
👉 Comece a vender!

🎉 Suas clientes vão amar sua loja personalizada!`,
    icone: <Share2 className="w-8 h-8" />,
    rota: '/revendedora/dashboard',
    acao: 'Ir para Dashboard'
  }
];

export default function OnboardingTutorial() {
  const [mostrar, setMostrar] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [finalizado, setFinalizado] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    verificarPrimeiroAcesso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verificarPrimeiroAcesso() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCarregando(false);
        return;
      }

      // Buscar dados da revendedora
      const { data: reseller } = await supabase
        .from('resellers')
        .select('id, onboarding_completo, created_at')
        .eq('user_id', user.id)
        .single();

      if (!reseller) {
        setCarregando(false);
        return;
      }

      // Verificar se já completou o onboarding
      if (reseller.onboarding_completo) {
        setCarregando(false);
        return;
      }

      // Verificar se é um usuário recém-criado (últimas 24h)
      const criadoEm = new Date(reseller.created_at);
      const agora = new Date();
      const horasDesdeRegistro = (agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60);

      // Mostrar onboarding se foi criado nas últimas 72 horas e não completou
      if (horasDesdeRegistro <= 72) {
        // Pequeno delay para não aparecer instantaneamente
        setTimeout(() => {
          setMostrar(true);
        }, 1000);
      }

      setCarregando(false);
    } catch (error) {
      console.error('Erro ao verificar primeiro acesso:', error);
      setCarregando(false);
    }
  }

  async function marcarOnboardingCompleto() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('resellers')
        .update({ onboarding_completo: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Erro ao marcar onboarding completo:', error);
    }
  }

  function irParaPasso(indice: number) {
    if (indice >= 0 && indice < PASSOS.length) {
      setPassoAtual(indice);
    }
  }

  function irParaRota() {
    const passo = PASSOS[passoAtual];
    setMostrar(false);
    router.push(passo.rota);
  }

  function proximoPasso() {
    if (passoAtual < PASSOS.length - 1) {
      setPassoAtual(passoAtual + 1);
    } else {
      // Último passo - finalizar
      setFinalizado(true);
      marcarOnboardingCompleto();
    }
  }

  function pularTutorial() {
    marcarOnboardingCompleto();
    setMostrar(false);
  }

  function fecharConclusao() {
    setFinalizado(false);
    setMostrar(false);
  }

  if (carregando || !mostrar) return null;

  const passo = PASSOS[passoAtual];

  // Tela de conclusão
  if (finalizado) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
          {/* Header com confete */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Parabéns! 🎉</h2>
            <p className="text-white/90 mt-2">Você está pronta para começar!</p>
          </div>

          <div className="p-6 text-center">
            <div className="flex justify-center gap-2 mb-4">
              {PASSOS.map((_, i) => (
                <CheckCircle key={i} className="w-6 h-6 text-green-500" />
              ))}
            </div>
            
            <p className="text-gray-600 mb-6">
              Agora você já sabe os primeiros passos para ter sucesso com sua loja!
              Qualquer dúvida, acesse os <strong>Tutoriais</strong> no menu lateral.
            </p>

            <button
              onClick={fecharConclusao}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
            >
              Começar a Vender! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 relative">
          <button
            onClick={pularTutorial}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Pular tutorial"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              {passo.icone}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm text-white/80 font-medium">Bem-vinda! Primeiros Passos</span>
              </div>
              <h2 className="text-xl font-bold text-white">{passo.titulo}</h2>
            </div>
          </div>

          {/* Indicadores de passo */}
          <div className="flex gap-2 mt-4">
            {PASSOS.map((_, i) => (
              <button
                key={i}
                onClick={() => irParaPasso(i)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i === passoAtual 
                    ? 'bg-white' 
                    : i < passoAtual 
                      ? 'bg-white/60' 
                      : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <p className="text-lg font-medium text-gray-800 mb-4">
            {passo.descricao}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {passo.detalhe}
            </pre>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            {passoAtual > 0 && (
              <button
                onClick={() => setPassoAtual(passoAtual - 1)}
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
            )}

            <button
              onClick={irParaRota}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 font-medium rounded-xl hover:bg-pink-200 transition-colors"
            >
              {passo.acao}
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={proximoPasso}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
            >
              {passoAtual < PASSOS.length - 1 ? 'Próximo' : 'Concluir'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Link para pular */}
          <button
            onClick={pularTutorial}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Já sei usar, pular tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
