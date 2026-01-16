// Funções utilitárias para C4 Wallet
// Usadas nas APIs e componentes do sistema de carteira

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ============================================
// TIPOS
// ============================================

export interface Wallet {
  id: string
  revendedora_id: string
  saldo: number
  saldo_bloqueado: number
  status: 'ativo' | 'bloqueado' | 'suspenso'
  limite_credito: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  tipo: TransactionType
  valor: number
  saldo_anterior: number
  saldo_posterior: number
  descricao: string | null
  referencia_tipo: string | null
  referencia_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type TransactionType =
  | 'CREDITO_PIX'
  | 'CREDITO_CARTAO'
  | 'CREDITO_ESTORNO'
  | 'CREDITO_BONUS'
  | 'CREDITO_CASHBACK'
  | 'DEBITO_RESERVA'
  | 'DEBITO_TAXA'
  | 'DEBITO_AJUSTE'
  | 'BLOQUEIO'
  | 'DESBLOQUEIO'

export interface Reserva {
  id: string
  revendedora_id: string
  wallet_id: string
  produto_id: string
  variacao_id: string | null
  quantidade: number
  preco_unitario: number
  preco_total: number
  status: ReservaStatus
  transaction_id: string | null
  separado_por: string | null
  separado_em: string | null
  enviado_em: string | null
  expira_em: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joins
  produto?: {
    nome: string
    imagem: string
  }
  variacao?: {
    tamanho: string
    cor: string
  }
}

export type ReservaStatus =
  | 'RESERVADO'
  | 'EM_SEPARACAO'
  | 'SEPARADO'
  | 'ENVIADO'
  | 'CANCELADO'
  | 'EXPIRADO'

export interface WalletRecarga {
  id: string
  wallet_id: string
  valor: number
  status: 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO' | 'ERRO'
  pix_id: string | null
  pix_qrcode: string | null
  pix_qrcode_base64: string | null
  pix_copia_cola: string | null
  pix_expiracao: string | null
  pago_em: string | null
  created_at: string
}

// ============================================
// FEATURE FLAG
// ============================================

const ALLOWED_SLUGS = ['vivaz'] // Lojas com acesso beta
const FEATURE_ENABLED = true // Flag global

export async function isWalletEnabled(slug: string, userId?: string): Promise<boolean> {
  if (!FEATURE_ENABLED) return false
  
  // Verifica se o slug está na lista permitida
  if (ALLOWED_SLUGS.includes(slug.toLowerCase())) {
    return true
  }
  
  // Verifica no banco se há configuração customizada
  try {
    const supabase = createClientComponentClient()
    const { data } = await supabase
      .from('wallet_config')
      .select('valor')
      .eq('chave', 'allowed_slugs')
      .single()
    
    if (data?.valor) {
      const allowedSlugs = JSON.parse(data.valor)
      if (allowedSlugs.includes(slug.toLowerCase())) {
        return true
      }
    }
    
    // Verifica se usuário específico tem acesso
    if (userId) {
      const { data: userData } = await supabase
        .from('wallet_config')
        .select('valor')
        .eq('chave', 'allowed_users')
        .single()
      
      if (userData?.valor) {
        const allowedUsers = JSON.parse(userData.valor)
        if (allowedUsers.includes(userId)) {
          return true
        }
      }
    }
  } catch (e) {
    console.error('Erro ao verificar feature flag:', e)
  }
  
  return false
}

// ============================================
// CARTEIRA
// ============================================

export async function getWallet(revendedoraId: string): Promise<Wallet | null> {
  const supabase = createClientComponentClient()
  
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('revendedora_id', revendedoraId)
    .single()
  
  if (error) {
    console.error('Erro ao buscar carteira:', error)
    return null
  }
  
  return data
}

export async function getWalletResumo(revendedoraId: string) {
  const supabase = createClientComponentClient()
  
  const { data, error } = await supabase
    .from('vw_wallet_resumo')
    .select('*')
    .eq('revendedora_id', revendedoraId)
    .single()
  
  if (error) {
    console.error('Erro ao buscar resumo:', error)
    return null
  }
  
  return data
}

// ============================================
// EXTRATO
// ============================================

export async function getExtrato(
  walletId: string,
  options: {
    limit?: number
    offset?: number
    tipo?: TransactionType
    dataInicio?: Date
    dataFim?: Date
  } = {}
): Promise<WalletTransaction[]> {
  const supabase = createClientComponentClient()
  
  let query = supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
  
  if (options.tipo) {
    query = query.eq('tipo', options.tipo)
  }
  
  if (options.dataInicio) {
    query = query.gte('created_at', options.dataInicio.toISOString())
  }
  
  if (options.dataFim) {
    query = query.lte('created_at', options.dataFim.toISOString())
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Erro ao buscar extrato:', error)
    return []
  }
  
  return data || []
}

// ============================================
// RESERVAS
// ============================================

export async function getReservas(
  revendedoraId: string,
  status?: ReservaStatus[]
): Promise<Reserva[]> {
  const supabase = createClientComponentClient()
  
  let query = supabase
    .from('reservas')
    .select(`
      *,
      produto:produtos(nome, imagem),
      variacao:produto_variacoes(tamanho, cor)
    `)
    .eq('revendedora_id', revendedoraId)
    .order('created_at', { ascending: false })
  
  if (status && status.length > 0) {
    query = query.in('status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Erro ao buscar reservas:', error)
    return []
  }
  
  return data || []
}

export async function getReservasNaCaixinha(revendedoraId: string): Promise<Reserva[]> {
  return getReservas(revendedoraId, ['RESERVADO', 'EM_SEPARACAO', 'SEPARADO'])
}

// ============================================
// RECARGA PIX
// ============================================

export async function criarRecargaPix(walletId: string, valor: number): Promise<{
  success: boolean
  recarga?: WalletRecarga
  error?: string
}> {
  try {
    const response = await fetch('/api/wallet/recarga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_id: walletId, valor })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao criar recarga' }
    }
    
    return { success: true, recarga: data.recarga }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: errorMessage }
  }
}

export async function getRecargaPendente(walletId: string): Promise<WalletRecarga | null> {
  const supabase = createClientComponentClient()
  
  const { data, error } = await supabase
    .from('wallet_recargas')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('status', 'PENDENTE')
    .gt('pix_expiracao', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) return null
  return data
}

// ============================================
// RESERVA (CHECKOUT CAIXINHA)
// ============================================

export async function fazerReserva(params: {
  revendedora_id: string
  produto_id: string
  variacao_id?: string
  quantidade: number
  preco_unitario: number
}): Promise<{
  success: boolean
  reserva_id?: string
  novo_saldo?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/wallet/reserva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao fazer reserva' }
    }
    
    return {
      success: true,
      reserva_id: data.reserva_id,
      novo_saldo: data.novo_saldo
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: errorMessage }
  }
}

export async function cancelarReserva(reservaId: string): Promise<{
  success: boolean
  valor_estornado?: number
  novo_saldo?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/wallet/reserva/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reserva_id: reservaId })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao cancelar reserva' }
    }
    
    return {
      success: true,
      valor_estornado: data.valor_estornado,
      novo_saldo: data.novo_saldo
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return { success: false, error: errorMessage }
  }
}

// ============================================
// HELPERS
// ============================================

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

export function getTipoTransacaoLabel(tipo: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    CREDITO_PIX: '💰 Recarga PIX',
    CREDITO_CARTAO: '💳 Recarga Cartão',
    CREDITO_ESTORNO: '↩️ Estorno',
    CREDITO_BONUS: '🎁 Bônus',
    CREDITO_CASHBACK: '💸 Cashback',
    DEBITO_RESERVA: '📦 Reserva',
    DEBITO_TAXA: '📋 Taxa',
    DEBITO_AJUSTE: '⚙️ Ajuste',
    BLOQUEIO: '🔒 Bloqueio',
    DESBLOQUEIO: '🔓 Desbloqueio'
  }
  return labels[tipo] || tipo
}

export function getStatusReservaLabel(status: ReservaStatus): string {
  const labels: Record<ReservaStatus, string> = {
    RESERVADO: '📦 Reservado',
    EM_SEPARACAO: '🔄 Em Separação',
    SEPARADO: '✅ Na Caixinha',
    ENVIADO: '🚚 Enviado',
    CANCELADO: '❌ Cancelado',
    EXPIRADO: '⏰ Expirado'
  }
  return labels[status] || status
}

export function getStatusReservaColor(status: ReservaStatus): string {
  const colors: Record<ReservaStatus, string> = {
    RESERVADO: 'bg-blue-100 text-blue-800',
    EM_SEPARACAO: 'bg-yellow-100 text-yellow-800',
    SEPARADO: 'bg-green-100 text-green-800',
    ENVIADO: 'bg-purple-100 text-purple-800',
    CANCELADO: 'bg-red-100 text-red-800',
    EXPIRADO: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function isCredito(tipo: TransactionType): boolean {
  return tipo.startsWith('CREDITO')
}

export function isDebito(tipo: TransactionType): boolean {
  return tipo.startsWith('DEBITO')
}
