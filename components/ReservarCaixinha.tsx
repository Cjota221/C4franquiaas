'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Wallet, 
  Check, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react'
import { formatarMoeda, isWalletEnabled } from '@/lib/wallet'

interface ReservarCaixinhaProps {
  produto: {
    id: string
    nome: string
    imagem?: string
    preco: number
  }
  variacao?: {
    id: string
    tamanho?: string
    cor?: string
  }
  quantidade: number
  precoUnitario: number
  slug: string
  userId?: string
  onSuccess?: (reservaId: string, novoSaldo: number) => void
  onError?: (error: string) => void
}

interface WalletInfo {
  id: string
  saldo: number
  status: string
}

export default function ReservarCaixinha({
  produto,
  variacao,
  quantidade,
  precoUnitario,
  slug,
  userId,
  onSuccess,
  onError
}: ReservarCaixinhaProps) {
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(false)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [featureEnabled, setFeatureEnabled] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  
  const precoTotal = precoUnitario * quantidade
  const saldoSuficiente = wallet && wallet.saldo >= precoTotal
  
  useEffect(() => {
    async function verificarFeature() {
      setLoading(true)
      
      try {
        // Verificar se a feature está habilitada para este slug
        const enabled = await isWalletEnabled(slug, userId)
        setFeatureEnabled(enabled)
        
        if (enabled) {
          // Buscar dados da carteira
          const response = await fetch('/api/wallet')
          const data = await response.json()
          
          if (data.wallet) {
            setWallet(data.wallet)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar feature:', error)
      } finally {
        setLoading(false)
      }
    }
    
    verificarFeature()
  }, [slug, userId])
  
  async function fazerReserva() {
    if (!wallet || !saldoSuficiente) return
    
    setReservando(true)
    setErro('')
    
    try {
      const response = await fetch('/api/wallet/reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_id: produto.id,
          variacao_id: variacao?.id,
          quantidade,
          preco_unitario: precoUnitario,
          metadata: {
            produto_nome: produto.nome,
            variacao_tamanho: variacao?.tamanho,
            variacao_cor: variacao?.cor
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSucesso(true)
        setWallet(prev => prev ? { ...prev, saldo: data.novo_saldo } : null)
        onSuccess?.(data.reserva_id, data.novo_saldo)
      } else {
        setErro(data.error || 'Erro ao fazer reserva')
        onError?.(data.error)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer reserva'
      setErro(message)
      onError?.(message)
    } finally {
      setReservando(false)
    }
  }
  
  // Não mostrar se feature não está habilitada
  if (!featureEnabled && !loading) {
    return null
  }
  
  if (loading) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }
  
  // Estado de sucesso
  if (sucesso) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 text-white p-2 rounded-full">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-green-800">Reservado na Caixinha! 📦</p>
            <p className="text-sm text-green-600">
              Seu produto foi reservado e já está separado pra você.
            </p>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-3">
          Novo saldo: {formatarMoeda(wallet?.saldo || 0)}
        </p>
      </div>
    )
  }
  
  // Não tem carteira ou carteira bloqueada
  if (!wallet || wallet.status !== 'ativo') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Wallet className="w-5 h-5" />
          <span className="font-medium">C4 Wallet</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Ative sua carteira para reservar produtos e pagar depois!
        </p>
        <a 
          href="/revendedora/carteira"
          className="inline-flex items-center gap-1 text-sm text-pink-600 font-medium mt-2 hover:underline"
        >
          Conhecer C4 Wallet
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    )
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500 text-white p-1.5 rounded-lg">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-bold text-purple-900">Reservar na Caixinha</span>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          Novo!
        </span>
      </div>
      
      {/* Info */}
      <div className="bg-white/70 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-purple-700">
            Pague agora com seu saldo e retire depois junto com outros produtos. 
            Mínimo 5 itens para envio.
          </p>
        </div>
      </div>
      
      {/* Resumo */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Seu saldo:</span>
          <span className={`font-bold ${saldoSuficiente ? 'text-green-600' : 'text-red-600'}`}>
            {formatarMoeda(wallet.saldo)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {quantidade}x {produto.nome.slice(0, 20)}...
          </span>
          <span className="font-medium">{formatarMoeda(precoTotal)}</span>
        </div>
        <div className="border-t border-purple-200 pt-2 flex justify-between">
          <span className="font-medium text-purple-900">Total a debitar:</span>
          <span className="font-bold text-purple-900">{formatarMoeda(precoTotal)}</span>
        </div>
      </div>
      
      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">{erro}</p>
        </div>
      )}
      
      {/* Saldo insuficiente */}
      {!saldoSuficiente && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
          <p className="text-xs text-yellow-800">
            ⚠️ Saldo insuficiente. Faltam {formatarMoeda(precoTotal - wallet.saldo)}
          </p>
          <a 
            href="/revendedora/carteira"
            className="text-xs text-yellow-700 font-medium hover:underline"
          >
            Recarregar carteira →
          </a>
        </div>
      )}
      
      {/* Botão */}
      <button
        onClick={fazerReserva}
        disabled={!saldoSuficiente || reservando}
        className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
          saldoSuficiente
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {reservando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Reservando...
          </>
        ) : (
          <>
            <Package className="w-5 h-5" />
            Reservar na Caixinha
          </>
        )}
      </button>
      
      {/* Saldo após */}
      {saldoSuficiente && (
        <p className="text-xs text-purple-600 text-center mt-2">
          Saldo após reserva: {formatarMoeda(wallet.saldo - precoTotal)}
        </p>
      )}
    </div>
  )
}
