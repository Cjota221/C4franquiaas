'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Smartphone, Share, Plus, ChevronDown, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detectar plataforma
function getPlatform() {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isChrome = /chrome/.test(ua) && !/edge/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isStandalone,
    isMobile: isIOS || isAndroid,
  };
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<ReturnType<typeof getPlatform>>('unknown');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const platformInfo = getPlatform();
    setPlatform(platformInfo);

    // Se já está instalado ou rodando standalone, não mostrar
    if (typeof platformInfo === 'object' && platformInfo.isStandalone) {
      return;
    }

    // Verificar se já foi dispensado recentemente (24h)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');
    if (dismissedAt) {
      const hoursAgo = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursAgo < 24) return;
    }

    // Evento para Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar após 2 segundos de navegação
      setTimeout(() => setShowPrompt(true), 2000);
    };

    // Evento quando o app é instalado
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Para iOS, mostrar após 3 segundos se não instalado
    if (typeof platformInfo === 'object' && platformInfo.isIOS && !platformInfo.isStandalone) {
      const wasInstalled = localStorage.getItem('pwa-installed');
      if (!wasInstalled) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (typeof platform === 'object' && platform.isIOS) {
      // Abrir modal de tutorial iOS
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      // Prompt nativo Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  }, [platform, deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setShowIOSModal(false);
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
  }, []);

  // Não mostrar se já instalado ou standalone
  if (typeof platform === 'object' && platform.isStandalone) return null;
  if (installed) return null;

  // Não mostrar se não há prompt disponível (exceto iOS)
  const isIOS = typeof platform === 'object' && platform.isIOS;
  if (!showPrompt && !isIOS) return null;
  if (!showPrompt && !showIOSModal) return null;

  return (
    <>
      {/* Botão/Banner flutuante */}
      {showPrompt && !showIOSModal && (
        <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white rounded-2xl shadow-2xl shadow-pink-500/30 p-4 relative overflow-hidden">
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            {/* Botão fechar */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 relative z-10">
              {/* Ícone */}
              <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Smartphone className="w-7 h-7" />
              </div>
              
              {/* Conteúdo */}
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-lg leading-tight mb-1">
                  Baixar App
                </h3>
                <p className="text-sm text-white/90 mb-3 leading-snug">
                  Acesse seu painel rapidamente direto da tela inicial!
                </p>

                <button
                  onClick={handleInstallClick}
                  className="w-full bg-white text-pink-600 px-4 py-2.5 rounded-xl font-bold 
                           hover:bg-pink-50 active:scale-[0.98] transition-all 
                           flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  {isIOS ? 'Instalar no iPhone' : 'Instalar Agora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tutorial iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleDismiss}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-500 safe-area-bottom">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Instalar no iPhone
                </h2>
                <button
                  onClick={handleDismiss}
                  className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Siga os passos abaixo para adicionar à tela inicial
              </p>
            </div>

            {/* Passos */}
            <div className="px-6 py-6 space-y-6">
              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <span className="text-pink-600 font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-2">
                    Toque no botão Compartilhar
                  </p>
                  <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Share className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Na barra inferior do Safari
                      </p>
                      <p className="text-xs text-gray-400">
                        É o ícone de quadrado com seta para cima
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seta animada */}
              <div className="flex justify-center">
                <ChevronDown className="w-6 h-6 text-pink-500 animate-bounce" />
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <span className="text-pink-600 font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-2">
                    Role para baixo e toque em
                  </p>
                  <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Adicionar à Tela de Início
                      </p>
                      <p className="text-xs text-gray-400">
                        Add to Home Screen
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seta animada */}
              <div className="flex justify-center">
                <ChevronDown className="w-6 h-6 text-pink-500 animate-bounce" />
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-2">
                    Confirme tocando em &quot;Adicionar&quot;
                  </p>
                  <p className="text-sm text-gray-500">
                    O ícone do app aparecerá na sua tela inicial!
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={handleDismiss}
                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold
                         hover:bg-pink-600 active:scale-[0.98] transition-all"
              >
                Entendi, vou fazer isso!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
