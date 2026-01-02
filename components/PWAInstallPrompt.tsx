'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iOS = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(iOS)

    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Verificar se já foi dispensado antes
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed || standalone) return

    // Esperar 3 segundos antes de mostrar
    const timer = setTimeout(() => {
      if (iOS) {
        setShowPrompt(true)
      }
    }, 3000)

    // Evento para Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA instalado')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl shadow-2xl p-4 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              Adicionar à Tela Inicial
            </h3>
            <p className="text-sm text-white/90 mb-3">
              Acesse seu painel rapidamente como um aplicativo!
            </p>

            {isIOS ? (
              <div className="text-xs text-white/80 space-y-1 mb-3 bg-white/10 rounded-lg p-2">
                <p className="font-semibold">Como instalar no iOS:</p>
                <p>1. Toque no ícone de compartilhar 
                  <span className="inline-block mx-1">
                    <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </span>
                </p>
                <p>2. Role para baixo</p>
                <p>3. Toque em &quot;Adicionar à Tela de Início&quot;</p>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
