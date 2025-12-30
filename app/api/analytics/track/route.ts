import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos de eventos suportados
type EventType = 
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search'

interface TrackingEvent {
  event_type: EventType
  session_id: string
  loja_id?: string
  user_id?: string
  
  // Page view
  page_path?: string
  page_title?: string
  page_type?: string
  referrer?: string
  
  // UTM
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  
  // Device
  device_type?: string
  browser?: string
  os?: string
  screen_width?: number
  screen_height?: number
  
  // Product
  produto_id?: string
  produto_nome?: string
  produto_categoria?: string
  produto_preco?: number
  quantidade?: number
  variacao?: string
  source?: string
  
  // Cart
  cart_total?: number
  cart_items_count?: number
  
  // Search
  search_query?: string
  results_count?: number
  clicked_product_id?: string
  clicked_position?: number
  
  // Extra
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const event: TrackingEvent = await request.json()
    
    if (!event.event_type || !event.session_id) {
      return NextResponse.json(
        { error: 'event_type e session_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Detectar device type se não fornecido
    const userAgent = request.headers.get('user-agent') || ''
    if (!event.device_type) {
      event.device_type = detectDeviceType(userAgent)
    }
    if (!event.browser) {
      event.browser = detectBrowser(userAgent)
    }
    if (!event.os) {
      event.os = detectOS(userAgent)
    }

    // Processar evento baseado no tipo
    switch (event.event_type) {
      case 'page_view':
        await trackPageView(event)
        break
      
      case 'product_view':
        await trackProductView(event)
        break
      
      case 'add_to_cart':
      case 'remove_from_cart':
      case 'view_cart':
      case 'begin_checkout':
      case 'purchase':
        await trackCartEvent(event)
        break
      
      case 'search':
        await trackSearchEvent(event)
        break
      
      default:
        return NextResponse.json(
          { error: 'Tipo de evento não suportado' },
          { status: 400 }
        )
    }

    // Atualizar sessão
    await updateSession(event)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao rastrear evento:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar evento' },
      { status: 500 }
    )
  }
}

// =============================================
// Funções de tracking
// =============================================

async function trackPageView(event: TrackingEvent) {
  await supabase.from('page_views').insert({
    session_id: event.session_id,
    user_id: event.user_id || null,
    loja_id: event.loja_id || null,
    page_path: event.page_path,
    page_title: event.page_title,
    page_type: event.page_type,
    referrer: event.referrer,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    device_type: event.device_type,
    browser: event.browser,
    os: event.os,
    screen_width: event.screen_width,
    screen_height: event.screen_height
  })
}

async function trackProductView(event: TrackingEvent) {
  await supabase.from('product_views').insert({
    session_id: event.session_id,
    user_id: event.user_id || null,
    loja_id: event.loja_id || null,
    produto_id: event.produto_id,
    produto_nome: event.produto_nome,
    produto_categoria: event.produto_categoria,
    produto_preco: event.produto_preco,
    source: event.source,
    search_query: event.search_query,
    device_type: event.device_type
  })
}

async function trackCartEvent(event: TrackingEvent) {
  await supabase.from('cart_events').insert({
    session_id: event.session_id,
    user_id: event.user_id || null,
    loja_id: event.loja_id || null,
    event_type: event.event_type,
    produto_id: event.produto_id || null,
    produto_nome: event.produto_nome,
    produto_preco: event.produto_preco,
    quantidade: event.quantidade,
    variacao: event.variacao,
    cart_total: event.cart_total,
    cart_items_count: event.cart_items_count,
    metadata: event.metadata || null
  })
}

async function trackSearchEvent(event: TrackingEvent) {
  await supabase.from('search_events').insert({
    session_id: event.session_id,
    loja_id: event.loja_id || null,
    search_query: event.search_query,
    results_count: event.results_count || 0,
    clicked_product_id: event.clicked_product_id || null,
    clicked_position: event.clicked_position || null,
    device_type: event.device_type
  })
}

async function updateSession(event: TrackingEvent) {
  // Verificar se sessão existe
  const { data: existingSession } = await supabase
    .from('analytics_sessions')
    .select('id')
    .eq('id', event.session_id)
    .single()

  if (existingSession) {
    // Atualizar sessão existente
    const updates: Record<string, unknown> = {
      last_activity_at: new Date().toISOString()
    }

    if (event.event_type === 'page_view') {
      await supabase.rpc('increment_session_page_views', { session_id: event.session_id })
    } else if (event.event_type === 'product_view') {
      await supabase.rpc('increment_session_products_viewed', { session_id: event.session_id })
    } else if (event.event_type === 'add_to_cart') {
      await supabase.rpc('increment_session_cart_additions', { session_id: event.session_id })
    } else if (event.event_type === 'purchase') {
      updates.converted = true
      updates.order_total = event.cart_total
    }

    await supabase
      .from('analytics_sessions')
      .update(updates)
      .eq('id', event.session_id)
  } else {
    // Criar nova sessão
    await supabase.from('analytics_sessions').insert({
      id: event.session_id,
      user_id: event.user_id || null,
      loja_id: event.loja_id || null,
      first_page: event.page_path,
      landing_page: event.page_path,
      referrer: event.referrer,
      utm_source: event.utm_source,
      utm_medium: event.utm_medium,
      utm_campaign: event.utm_campaign,
      device_type: event.device_type,
      browser: event.browser,
      os: event.os
    })
  }
}

// =============================================
// Funções auxiliares de detecção
// =============================================

function detectDeviceType(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet'
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile'
  }
  return 'desktop'
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('SamsungBrowser')) return 'Samsung Browser'
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'IE'
  return 'Outro'
}

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac OS')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Outro'
}
