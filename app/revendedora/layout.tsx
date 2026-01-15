"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SidebarRevendedora from '@/components/revendedora/SidebarRevendedora';
import MobileNavigation from '@/components/revendedora/MobileNavigation';
import { GoogleAnalyticsTracker } from '@/components/GoogleAnalyticsTracker';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OnboardingTutorial from '@/components/revendedora/OnboardingTutorial';
import AlertaProdutosSemMargem from '@/components/revendedora/AlertaProdutosSemMargem';

// Cache de sessão para evitar verificações repetidas
const SESSION_CACHE_KEY = 'revendedora_session_cache';
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

type SessionCache = {
  timestamp: number;
  status: 'aprovada' | 'pendente' | 'rejeitada';
  isActive: boolean;
  userId: string;
};

function getSessionCache(): SessionCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached) as SessionCache;
    if (Date.now() - data.timestamp > SESSION_CACHE_TTL) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setSessionCache(data: Omit<SessionCache, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
}

export function clearSessionCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_CACHE_KEY);
}

export default function RevendedoraRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [desativada, setDesativada] = useState(false);
  const [statusConta, setStatusConta] = useState<'pendente' | 'rejeitada' | 'desativada' | null>(null);

  const verificarAcesso = useCallback(async () => {
    const supabase = createClient();
    
    // Verificar se está logado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      clearSessionCache();
      router.push('/login/revendedora');
      return;
    }

    // ⚡ OTIMIZAÇÃO: Verificar cache primeiro
    const cached = getSessionCache();
    if (cached && cached.userId === user.id) {
      if (cached.status === 'aprovada' && cached.isActive) {
        setLoading(false);
        return;
      }
      // Cache indica problema, verificar no banco
    }

    // Verificar se é revendedora E seu status
    const { data: revendedora } = await supabase
      .from('resellers')
      .select('id, status, is_active, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!revendedora) {
      clearSessionCache();
      await supabase.auth.signOut();
      router.push('/login/revendedora');
      return;
    }

    // Salvar no cache para navegações futuras
    setSessionCache({
      status: revendedora.status as 'aprovada' | 'pendente' | 'rejeitada',
      isActive: revendedora.is_active,
      userId: user.id,
    });

    // ✅ VERIFICAR STATUS DA CONTA
    
    // 1️⃣ PENDENTE (Cadastro aguardando aprovação)
    if (revendedora.status === 'pendente') {
      setStatusConta('pendente');
      setDesativada(true);
      setLoading(false);
      return;
    }
    
    // 2️⃣ REJEITADA (Cadastro foi recusado)
    if (revendedora.status === 'rejeitada') {
      setStatusConta('rejeitada');
      setDesativada(true);
      setLoading(false);
      return;
    }
    
    // 3️⃣ DESATIVADA (Conta aprovada mas temporariamente inativa)
    if (!revendedora.is_active) {
      setStatusConta('desativada');
      setDesativada(true);
      setLoading(false);
      return;
    }
    
    // 4️⃣ Status não aprovado
    if (revendedora.status !== 'aprovada') {
      clearSessionCache();
      await supabase.auth.signOut();
      router.push('/login/revendedora');
      return;
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    verificarAcesso();
  }, [verificarAcesso]);

  // Tela de Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // 🆕 TELAS DE BLOQUEIO BASEADAS NO STATUS
  if (desativada) {
    const handleLogout = async () => {
      clearSessionCache();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login/revendedora');
    };

    // ⏳ CADASTRO PENDENTE (Aguardando aprovação)
    if (statusConta === 'pendente') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl border-2 border-yellow-300">
            {/* Ícone de Relógio */}
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Mensagem */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              ⏳ Cadastro em Análise
            </h1>
            
            <div className="space-y-4 text-center">
              <p className="text-gray-700 text-lg">
                Seu cadastro está sendo <strong>analisado</strong> pela nossa equipe!
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  📱 Em breve você receberá:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 text-left">
                  <li>✓ Mensagem no WhatsApp com a confirmação</li>
                  <li>✓ E-mail com instruções de acesso</li>
                  <li>✓ Link para acessar sua loja</li>
                </ul>
              </div>

              <p className="text-gray-600 text-sm">
                Geralmente aprovamos cadastros em até <strong>24 horas</strong>. Aguarde nosso contato! 💬
              </p>
            </div>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      );
    }

    // ❌ CADASTRO REJEITADO
    if (statusConta === 'rejeitada') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl border-2 border-red-300">
            {/* Ícone de X */}
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Mensagem */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              ❌ Cadastro Não Aprovado
            </h1>
            
            <div className="space-y-4 text-center">
              <p className="text-gray-700">
                Infelizmente seu cadastro <strong>não foi aprovado</strong>.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold">
                  📞 Entre em contato:
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Fale com nosso time pelo WhatsApp para entender o motivo e tentar novamente.
                </p>
              </div>
            </div>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      );
    }

    // 🚫 CONTA DESATIVADA (Aprovada mas temporariamente inativa)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl border-2 border-orange-300">
          {/* Ícone de Bloqueio */}
          <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Mensagem */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            🚫 Loja Temporariamente Desativada
          </h1>
          
          <div className="space-y-4 text-center">
            <p className="text-gray-700">
              Sua loja foi <strong>temporariamente desativada</strong> pelo administrador.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Acesso Bloqueado:</strong>
              </p>
              <ul className="text-sm text-orange-700 mt-2 space-y-1 text-left">
                <li>• Dashboard indisponível</li>
                <li>• Site público desativado</li>
                <li>• Produtos não visíveis para clientes</li>
              </ul>
            </div>

            <p className="text-gray-600 text-sm">
              Entre em contato com o administrador pelo WhatsApp para reativar sua conta.
            </p>
          </div>

          {/* Botão Sair */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <GoogleAnalyticsTracker />
      <PWAInstallPrompt />
      <OnboardingTutorial />
      
      {/* Sidebar Desktop */}
      <SidebarRevendedora />
      
      {/* Área Principal */}
      <main className="flex-1 w-full lg:ml-0">
        {/* Padding para acomodar Header (top) e Bottom Bar (bottom) no mobile */}
        {/* pb-40 (160px) garante que botões "Salvar" não fiquem escondidos pela Bottom Bar */}
        <div className="pt-14 pb-40 lg:pt-0 lg:pb-0 min-h-screen">
          <AlertaProdutosSemMargem />
          {children}
        </div>
      </main>
      
      {/* Mobile Navigation - Header (Top) + Bottom Bar + Drawer */}
      <MobileNavigation />
    </div>
  );
}
