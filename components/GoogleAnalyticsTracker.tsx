'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  setGaUserId, 
  trackPageViewWithUser, 
  trackPainelEvent, 
  getViewEventFromPath 
} from '@/lib/analytics'

const GA_TRACKING_ID = 'G-Q1TM0EYRBN'

// Componente para rastrear navegação no GA4 com User ID
export function GoogleAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Carregar dados do usuário logado
  useEffect(() => {
    async function loadUser() {
      // Verificar se estamos na área de revendedora
      if (!pathname?.startsWith('/revendedora')) {
        setInitialized(true)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Buscar dados da revendedora
        const { data: reseller } = await supabase
          .from('resellers')
          .select('id, name, store_name')
          .eq('user_id', user.id)
          .single()
        
        if (reseller) {
          setUserId(reseller.id)
          setUserName(reseller.name || reseller.store_name || 'Revendedora')
          
          // Configurar User ID no GA4
          setGaUserId(reseller.id, reseller.name || reseller.store_name)
        }
      }
      
      setInitialized(true)
    }

    loadUser()
  }, [pathname])

  // Rastrear mudanças de página
  useEffect(() => {
    if (!pathname || typeof window === 'undefined' || !initialized) return

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
      let revendedoraNome = userName || ''

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
      } else if (pathname.startsWith('/revendedora')) {
        pageType = 'painel_revendedora'
      } else if (pathname === '/') {
        pageType = 'landing'
      }

      // Se for área de revendedora, usar tracking com User ID
      if (pathname.startsWith('/revendedora') && userId) {
        // Enviar page view com User ID
        trackPageViewWithUser(fullUrl, pageTitle, {
          page_type: pageType,
          revendedora_nome: revendedoraNome,
        })
        
        // Enviar evento específico da página
        const viewEvent = getViewEventFromPath(pathname)
        if (viewEvent) {
          trackPainelEvent(viewEvent, {
            page_path: fullUrl,
          })
        }
      } else {
        // Tracking padrão para visitantes anônimos
        window.gtag('config', GA_TRACKING_ID, {
          page_path: fullUrl,
          page_title: pageTitle,
          page_location: window.location.origin + fullUrl,
          send_page_view: true,
          revendedora_nome: revendedoraNome,
          page_type: pageType,
        })

        // Evento personalizado
        window.gtag('event', 'virtual_pageview', {
          page_path: fullUrl,
          page_location: window.location.origin + fullUrl,
          page_title: pageTitle,
          page_type: pageType,
          loja_dominio: lojaDominio,
          loja_nome: lojaDominio ? lojaDominio.charAt(0).toUpperCase() + lojaDominio.slice(1) : '',
          revendedora_nome: revendedoraNome,
        })
      }

      console.log(`📊 GA4 Pageview: ${fullUrl}`)
      console.log(`📋 Título: "${pageTitle}" | Tipo: ${pageType}`)
      if (userId) {
        console.log(`👤 Franqueada: ${userName} (${userId})`)
      }
    }

    // Pequeno delay para garantir que a página carregou
    setTimeout(waitForGtag, 100)

  }, [pathname, searchParams, userId, userName, initialized])

  return null
}

// Re-exportar funções do analytics para facilitar uso
export { 
  trackPainelEvent, 
  setGaUserId,
  trackPageViewWithUser 
} from '@/lib/analytics'

// Função helper para enviar eventos customizados (compatibilidade)
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

// Declarar gtag no window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
