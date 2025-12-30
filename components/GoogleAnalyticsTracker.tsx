'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_TRACKING_ID = 'G-Q1TM0EYRBN'

// Componente para rastrear navegação no GA4
export function GoogleAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return

    // Aguardar o gtag estar disponível
    const waitForGtag = () => {
      if (!window.gtag) {
        setTimeout(waitForGtag, 100)
        return
      }
      
      // Construir URL completa
      const fullUrl = searchParams?.toString() 
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      // Determinar título da página
      const pageTitle = document.title || pathname

      // Determinar tipo de página para dimensão customizada
      let pageType = 'outro'
      let lojaDominio = ''

      // Extrair informações da URL
      const pathParts = pathname.split('/')
      
      if (pathname.startsWith('/loja/')) {
        lojaDominio = pathParts[2] || ''
        
        if (pathname.includes('/produto/')) {
          pageType = 'produto'
        } else if (pathname.includes('/carrinho')) {
          pageType = 'carrinho'
        } else if (pathname.includes('/checkout')) {
          pageType = 'checkout'
        } else if (pathname.includes('/produtos')) {
          pageType = 'catalogo'
        } else if (pathParts.length === 3) {
          pageType = 'catalogo_home'
        }
      } else if (pathname.startsWith('/admin')) {
        pageType = 'admin'
      } else if (pathname.startsWith('/franqueada')) {
        pageType = 'franqueada'
      } else if (pathname === '/') {
        pageType = 'landing'
      }

      // MÉTODO 1: Atualizar config para registrar pageview corretamente
      window.gtag('config', GA_TRACKING_ID, {
        page_path: fullUrl,
        page_title: pageTitle,
        page_location: window.location.origin + fullUrl,
        send_page_view: true
      })

      // MÉTODO 2: Enviar evento personalizado para ter mais detalhes
      window.gtag('event', 'virtual_pageview', {
        page_path: fullUrl,
        page_location: window.location.origin + fullUrl,
        page_title: pageTitle,
        page_type: pageType,
        loja_dominio: lojaDominio,
        loja_nome: lojaDominio ? lojaDominio.charAt(0).toUpperCase() + lojaDominio.slice(1) : ''
      })

      console.log(`📊 GA4 Pageview: ${fullUrl}`, { pageType, lojaDominio })
    }

    // Pequeno delay para garantir que a página carregou
    setTimeout(waitForGtag, 100)

  }, [pathname, searchParams])

  return null
}

// Função helper para enviar eventos customizados
export function sendGA4Event(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
    console.log(`📊 GA4 Event: ${eventName}`, params)
  }
}

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
