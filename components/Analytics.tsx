'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Gerar ou recuperar session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Detectar tipo de dispositivo
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Detectar tipo de página
function getPageType(pathname: string): string {
  if (pathname === '/') return 'landing'
  if (pathname.startsWith('/catalogo/')) return 'catalogo'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/franqueada')) return 'franqueada'
  if (pathname.startsWith('/revendedora')) return 'revendedora'
  if (pathname.includes('/produto/')) return 'produto'
  if (pathname.includes('/checkout')) return 'checkout'
  if (pathname.includes('/carrinho')) return 'carrinho'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/cadastro')) return 'cadastro'
  return 'outro'
}

interface AnalyticsTrackerProps {
  lojaId?: string
  userId?: string
}

export function AnalyticsTracker({ lojaId, userId }: AnalyticsTrackerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPath = useRef<string>('')

  // Função para enviar eventos
  const trackEvent = useCallback(async (eventData: Record<string, unknown>) => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) return

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          loja_id: lojaId,
          device_type: getDeviceType(),
          screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
          screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
          ...eventData
        })
      })
    } catch (error) {
      // Silenciosamente falha para não afetar UX
      console.debug('Analytics tracking error:', error)
    }
  }, [lojaId, userId])

  // Rastrear page views
  useEffect(() => {
    if (pathname === lastTrackedPath.current) return
    lastTrackedPath.current = pathname

    const pageType = getPageType(pathname)
    
    // Extrair UTM params
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    trackEvent({
      event_type: 'page_view',
      page_path: pathname,
      page_title: typeof document !== 'undefined' ? document.title : '',
      page_type: pageType,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign
    })
  }, [pathname, searchParams, trackEvent])

  return null // Componente invisível
}

// =============================================
// Hook para tracking manual de eventos
// =============================================

export function useAnalytics(lojaId?: string, userId?: string) {
  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, unknown> = {}
  ) => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) return

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          session_id: sessionId,
          user_id: userId,
          loja_id: lojaId,
          device_type: getDeviceType(),
          ...eventData
        })
      })
    } catch (error) {
      console.debug('Analytics tracking error:', error)
    }
  }, [lojaId, userId])

  // Funções de conveniência
  const trackProductView = useCallback((produto: {
    id: string
    nome: string
    categoria?: string
    preco?: number
    source?: string
  }) => {
    trackEvent('product_view', {
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_categoria: produto.categoria,
      produto_preco: produto.preco,
      source: produto.source || 'catalogo'
    })
  }, [trackEvent])

  const trackAddToCart = useCallback((produto: {
    id: string
    nome: string
    preco: number
    quantidade: number
    variacao?: string
  }) => {
    trackEvent('add_to_cart', {
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_preco: produto.preco,
      quantidade: produto.quantidade,
      variacao: produto.variacao
    })
  }, [trackEvent])

  const trackRemoveFromCart = useCallback((produto: {
    id: string
    nome: string
  }) => {
    trackEvent('remove_from_cart', {
      produto_id: produto.id,
      produto_nome: produto.nome
    })
  }, [trackEvent])

  const trackBeginCheckout = useCallback((cart: {
    total: number
    itemsCount: number
  }) => {
    trackEvent('begin_checkout', {
      cart_total: cart.total,
      cart_items_count: cart.itemsCount
    })
  }, [trackEvent])

  const trackPurchase = useCallback((order: {
    orderId: string
    total: number
    itemsCount: number
  }) => {
    trackEvent('purchase', {
      cart_total: order.total,
      cart_items_count: order.itemsCount,
      metadata: { order_id: order.orderId }
    })
  }, [trackEvent])

  const trackSearch = useCallback((search: {
    query: string
    resultsCount: number
    clickedProductId?: string
    clickedPosition?: number
  }) => {
    trackEvent('search', {
      search_query: search.query,
      results_count: search.resultsCount,
      clicked_product_id: search.clickedProductId,
      clicked_position: search.clickedPosition
    })
  }, [trackEvent])

  return {
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackPurchase,
    trackSearch
  }
}

// =============================================
// Componente de Google Analytics 4
// =============================================

interface GoogleAnalyticsProps {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return

    // Carregar script do GA4
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script1)

    // Inicializar GA4
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    `
    document.head.appendChild(script2)

    // Expor gtag globalmente
    window.gtag = function() {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer || []).push(arguments)
    }

    return () => {
      // Cleanup se necessário
    }
  }, [measurementId])

  return null
}

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

// =============================================
// Função para enviar eventos ao GA4
// =============================================

export function sendGAEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}
