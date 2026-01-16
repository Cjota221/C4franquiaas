'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [userLoaded, setUserLoaded] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  // Carregar dados do usuário logado (apenas uma vez)
  useEffect(() => {
    async function loadUser() {
      // Verificar se estamos na área de revendedora
      if (!pathname?.startsWith('/revendedora')) {
        setUserLoaded(true)
        return
      }

      try {
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
            const name = reseller.name || reseller.store_name || 'Revendedora'
            setUserId(reseller.id)
            setUserName(name)
            
            // Configurar User ID no GA4
            setGaUserId(reseller.id, name)
            
            console.log(`✅ GA4: Franqueada identificada: ${name} (${reseller.id})`)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário para GA4:', error)
      }
      
      setUserLoaded(true)
    }

    // Só carrega o usuário se ainda não foi carregado
    if (!userLoaded && pathname?.startsWith('/revendedora')) {
      loadUser()
    } else if (!pathname?.startsWith('/revendedora')) {
      setUserLoaded(true)
    }
  }, [pathname, userLoaded])

  // Rastrear mudanças de página (só após usuário carregar)
  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return
    if (!userLoaded) return // ESPERA o usuário carregar
    if (lastTrackedPath.current === pathname) return // Evita duplicatas

    lastTrackedPath.current = pathname

    const trackPage = () => {
      if (!window.gtag) {
        setTimeout(trackPage, 100)
        return
      }
      
      // Construir URL completa
      const fullUrl = searchParams?.toString() 
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      // Determinar título da página
      const pageTitle = document.title || pathname

      // Determinar tipo de página
      let pageType = 'outro'
      let lojaDominio = ''
      const revendedoraNome = userName || ''

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
        
        console.log(`📊 GA4 Pageview: ${fullUrl}`)
        console.log(`👤 Franqueada: ${userName} (${userId})`)
      } else if (pathname.startsWith('/revendedora') && !userId) {
        // Área de revendedora mas sem userId - ainda assim enviar com nome se tiver
        console.log(`⚠️ GA4: Aguardando identificação do usuário para ${fullUrl}`)
      } else {
        // Tracking padrão para visitantes anônimos (lojas públicas)
        window.gtag('config', GA_TRACKING_ID, {
          page_path: fullUrl,
          page_title: pageTitle,
          page_location: window.location.origin + fullUrl,
          send_page_view: true,
          revendedora_nome: revendedoraNome,
          page_type: pageType,
        })

        window.gtag('event', 'virtual_pageview', {
          page_path: fullUrl,
          page_location: window.location.origin + fullUrl,
          page_title: pageTitle,
          page_type: pageType,
          loja_dominio: lojaDominio,
          loja_nome: lojaDominio ? lojaDominio.charAt(0).toUpperCase() + lojaDominio.slice(1) : '',
          revendedora_nome: revendedoraNome,
        })
        
        console.log(`📊 GA4 Pageview: ${fullUrl} | Tipo: ${pageType}`)
      }
    }

    // Pequeno delay para garantir que a página carregou
    setTimeout(trackPage, 150)

  }, [pathname, searchParams, userId, userName, userLoaded])

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
