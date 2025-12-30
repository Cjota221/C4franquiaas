'use client'

import { useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLojaInfo } from '@/contexts/LojaContext'

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

// Detectar navegador
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Other'
}

// Detectar OS
function getOS(): string {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'MacOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

// Detectar tipo de página
function getPageType(pathname: string): string {
  if (pathname.includes('/produto/')) return 'produto'
  if (pathname.includes('/carrinho')) return 'carrinho'
  if (pathname.includes('/checkout')) return 'checkout'
  if (pathname.includes('/favoritos')) return 'favoritos'
  if (pathname.includes('/produtos')) return 'catalogo'
  // Página inicial da loja
  if (pathname.match(/^\/loja\/[^/]+\/?$/)) return 'catalogo'
  return 'outro'
}

export function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const loja = useLojaInfo()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPath = useRef<string>('')
  const sessionStarted = useRef(false)

  // Função para enviar eventos
  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, unknown> = {}) => {
    try {
      const sessionId = getSessionId()
      if (!sessionId || !loja?.id) return

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          session_id: sessionId,
          loja_id: loja.id,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
          screen_height: typeof window !== 'undefined' ? window.innerHeight : null,
          ...eventData
        })
      })
    } catch (error) {
      // Silenciosamente falha para não afetar UX
      console.debug('Analytics tracking error:', error)
    }
  }, [loja?.id])

  // Inicializar sessão
  useEffect(() => {
    if (sessionStarted.current || !loja?.id) return
    sessionStarted.current = true

    // Criar/atualizar sessão
    const sessionId = getSessionId()
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'session_start',
        session_id: sessionId,
        loja_id: loja.id,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        landing_page: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      })
    }).catch(console.debug)
  }, [loja?.id, pathname, searchParams])

  // Rastrear page views
  useEffect(() => {
    if (!loja?.id) return
    
    const fullPath = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    if (fullPath === lastTrackedPath.current) return
    lastTrackedPath.current = fullPath

    const pageType = getPageType(pathname)
    
    // Extrair UTM params
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    trackEvent('page_view', {
      page_path: pathname,
      page_title: typeof document !== 'undefined' ? document.title : '',
      page_type: pageType,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign
    })

    // Também envia pro GA4 se configurado
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title
      })
    }
  }, [pathname, searchParams, trackEvent, loja?.id])

  return <>{children}</>
}

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
