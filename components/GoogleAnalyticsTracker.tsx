'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_TRACKING_ID = 'G-Q1TM0EYRBN'

// Componente para rastrear navegação no GA4
export function GoogleAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || typeof window === 'undefined' || !window.gtag) return

    // Construir URL completa
    const url = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    // Determinar título da página
    const pageTitle = document.title || pathname

    // Determinar tipo de página para dimensão customizada
    let pageType = 'outro'
    let lojaNome = ''
    let lojaDominio = ''

    // Extrair informações da URL
    const pathParts = pathname.split('/')
    
    if (pathname.startsWith('/loja/')) {
      lojaDominio = pathParts[2] || ''
      lojaNome = lojaDominio // Será sobrescrito se tivermos o nome real
      
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

    // Enviar page_view para o GA4
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: pageTitle,
      // Dimensões customizadas
      page_type: pageType,
      loja_dominio: lojaDominio,
    })

    console.debug(`📊 GA4 page_view: ${pathname}`, { pageType, lojaDominio })

  }, [pathname, searchParams])

  return null
}

// Função helper para enviar eventos customizados
export function sendGA4Event(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
    console.debug(`📊 GA4 Event: ${eventName}`, params)
  }
}

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
