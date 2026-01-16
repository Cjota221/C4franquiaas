'use client'

import { useState, useEffect } from 'react'
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  Copy, 
  Check,
  RefreshCw,
  Package,
  QrCode,
  TrendingUp,
  Eye,
  EyeOff,
  X,
  AlertCircle
} from 'lucide-react'
import { 
  formatarMoeda, 
  getTipoTransacaoLabel, 
  getStatusReservaLabel,
  getStatusReservaColor,
  isCredito,
  type WalletTransaction,
  type Reserva,
  type WalletRecarga
} from '@/lib/wallet'

interface WalletData {
  id: string
  saldo: number
  saldo_bloqueado: number
  status: string
}

export default function MinhaCarteiraPage() {
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [extrato, setExtrato] = useState<WalletTransaction[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [reservasTotais, setReservasTotais] = useState({ total: 0, valor: 0 })
  const [showSaldo, setShowSaldo] = useState(true)
  const [activeTab, setActiveTab] = useState<'extrato' | 'reservas'>('extrato')
  
  // Modal de recarga
  const [showRecargaModal, setShowRecargaModal] = useState(false)
  const [valorRecarga, setValorRecarga] = useState('')
  const [loadingRecarga, setLoadingRecarga] = useState(false)
  const [recargaPendente, setRecargaPendente] = useState<WalletRecarga | null>(null)
  const [copiado, setCopiado] = useState(false)
  
  useEffect(() => {
    carregarDados()
  }, [])
  
  async function carregarDados() {
    setLoading(true)
    
    try {
      // Buscar dados da carteira
      const response = await fetch('/api/wallet')
      const data = await response.json()
      
      if (data.wallet) {
        setWallet(data.wallet)
        setExtrato(data.extrato || [])
        setReservasTotais(data.reservas || { total: 0, valor: 0 })
      }
      
      // Buscar reservas detalhadas
      const reservasResponse = await fetch('/api/wallet/reserva?status=RESERVADO,EM_SEPARACAO,SEPARADO')
      const reservasData = await reservasResponse.json()
      
      if (reservasData.reservas) {
        setReservas(reservasData.reservas)
      }
      
      // Verificar recarga pendente
      const recargaResponse = await fetch('/api/wallet/recarga')
      const recargaData = await recargaResponse.json()
      
      const pendente = recargaData.recargas?.find((r: { status: string; pix_expiracao: string }) => 
        r.status === 'PENDENTE' && new Date(r.pix_expiracao) > new Date()
      )
      
      if (pendente) {
        setRecargaPendente(pendente)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function criarRecarga() {
    const valor = parseFloat(valorRecarga.replace(',', '.'))
    
    if (isNaN(valor) || valor < 150) {
      alert('Valor mínimo de recarga é R$ 150,00')
      return
    }
    
    if (valor > 5000) {
      alert('Valor máximo de recarga é R$ 5.000,00')
      return
    }
    
    setLoadingRecarga(true)
    
    try {
      const response = await fetch('/api/wallet/recarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: wallet?.id,
          valor
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRecargaPendente(data.recarga)
        setValorRecarga('')
      } else {
        alert(data.error || 'Erro ao criar recarga')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar recarga')
    } finally {
      setLoadingRecarga(false)
    }
  }
  
  function copiarPixCopiaCola() {
    if (recargaPendente?.pix_copia_cola) {
      navigator.clipboard.writeText(recargaPendente.pix_copia_cola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }
  
  async function cancelarReserva(reservaId: string) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva? O valor será estornado.')) {
      return
    }
    
    try {
      const response = await fetch('/api/wallet/reserva/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reserva_id: reservaId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Reserva cancelada! R$ ${data.valor_estornado.toFixed(2)} estornado.`)
        carregarDados()
      } else {
        alert(data.error || 'Erro ao cancelar reserva')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao cancelar reserva')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Minha Carteira
          </h1>
          <button 
            onClick={carregarDados}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Saldo */}
        <div className="text-center">
          <p className="text-white/80 text-sm mb-1">Saldo Disponível</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold">
              {showSaldo ? formatarMoeda(wallet?.saldo || 0) : '••••••'}
            </span>
            <button onClick={() => setShowSaldo(!showSaldo)}>
              {showSaldo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {wallet?.saldo_bloqueado > 0 && (
            <p className="text-white/60 text-sm mt-2">
              + {formatarMoeda(wallet.saldo_bloqueado)} em processamento
            </p>
          )}
        </div>
      </div>
      
      {/* Cards flutuantes */}
      <div className="px-4 -mt-14">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Card Reservas */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Package className="w-4 h-4" />
              <span className="text-xs">Na Caixinha</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{reservasTotais.total}</p>
            <p className="text-xs text-gray-500">{formatarMoeda(reservasTotais.valor)}</p>
          </div>
          
          {/* Card Adicionar */}
          <button 
            onClick={() => setShowRecargaModal(true)}
            className="bg-white rounded-xl shadow-lg p-4 text-left hover:shadow-xl transition"
          >
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <ArrowUpCircle className="w-4 h-4" />
              <span className="text-xs">Adicionar</span>
            </div>
            <p className="text-lg font-bold text-gray-900">Recarregar</p>
            <p className="text-xs text-gray-500">via PIX</p>
          </button>
        </div>
        
        {/* Recarga pendente */}
        {recargaPendente && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Recarga Pendente</span>
              </div>
              <span className="text-lg font-bold text-yellow-800">
                {formatarMoeda(recargaPendente.valor)}
              </span>
            </div>
            
            <p className="text-sm text-yellow-700 mb-3">
              Escaneie o QR Code ou copie o código PIX:
            </p>
            
            {recargaPendente.pix_qrcode_base64 && (
              <div className="flex justify-center mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`data:image/png;base64,${recargaPendente.pix_qrcode_base64}`}
                  alt="QR Code PIX"
                  className="w-40 h-40"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={copiarPixCopiaCola}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-4 rounded-lg transition"
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            
            <p className="text-xs text-yellow-600 text-center mt-2">
              Expira em: {new Date(recargaPendente.pix_expiracao).toLocaleTimeString()}
            </p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('extrato')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === 'extrato' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600'
            }`}
          >
            Extrato
          </button>
          <button
            onClick={() => setActiveTab('reservas')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === 'reservas' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600'
            }`}
          >
            Reservas ({reservas.length})
          </button>
        </div>
        
        {/* Conteúdo das tabs */}
        {activeTab === 'extrato' ? (
          <div className="bg-white rounded-xl shadow-lg">
            {extrato.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma transação ainda</p>
                <p className="text-sm">Faça sua primeira recarga!</p>
              </div>
            ) : (
              <div className="divide-y">
                {extrato.map((transacao) => (
                  <div key={transacao.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        isCredito(transacao.tipo) 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {isCredito(transacao.tipo) 
                          ? <ArrowUpCircle className="w-5 h-5" />
                          : <ArrowDownCircle className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {getTipoTransacaoLabel(transacao.tipo)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transacao.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        isCredito(transacao.tipo) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCredito(transacao.tipo) ? '+' : '-'} {formatarMoeda(transacao.valor)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Saldo: {formatarMoeda(transacao.saldo_posterior)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reservas.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma reserva na caixinha</p>
                <p className="text-sm">Compre produtos para reservar!</p>
              </div>
            ) : (
              reservas.map((reserva) => (
                <div key={reserva.id} className="bg-white rounded-xl shadow-lg p-4">
                  <div className="flex gap-3">
                    {reserva.produto?.imagem && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={reserva.produto.imagem}
                        alt={reserva.produto?.nome}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {reserva.produto?.nome}
                          </p>
                          {reserva.variacao && (
                            <p className="text-xs text-gray-500">
                              {reserva.variacao.tamanho} - {reserva.variacao.cor}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Qtd: {reserva.quantidade}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusReservaColor(reserva.status)
                        }`}>
                          {getStatusReservaLabel(reserva.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900">
                          {formatarMoeda(reserva.preco_total)}
                        </span>
                        
                        {['RESERVADO', 'EM_SEPARACAO'].includes(reserva.status) && (
                          <button
                            onClick={() => cancelarReserva(reserva.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Modal de Recarga */}
      {showRecargaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recarregar Carteira</h2>
              <button 
                onClick={() => setShowRecargaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da recarga
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  R$
                </span>
                <input
                  type="text"
                  value={valorRecarga}
                  onChange={(e) => setValorRecarga(e.target.value.replace(/[^\d,]/g, ''))}
                  placeholder="150,00"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Mínimo: R$ 150,00 | Máximo: R$ 5.000,00
              </p>
            </div>
            
            {/* Valores sugeridos */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[150, 300, 500, 1000, 2000, 3000].map((valor) => (
                <button
                  key={valor}
                  onClick={() => setValorRecarga(valor.toString())}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    valorRecarga === valor.toString()
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {formatarMoeda(valor)}
                </button>
              ))}
            </div>
            
            <button
              onClick={criarRecarga}
              disabled={loadingRecarga || !valorRecarga}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingRecarga ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Gerar PIX
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              O PIX será gerado e você terá 30 minutos para pagar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
