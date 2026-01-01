'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Settings, 
  Smartphone, 
  RefreshCw, 
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Bell,
  Clock,
  Construction
} from 'lucide-react'

interface ResellerData {
  id: string
  whatsapp_instance_id?: string
  notification_settings?: NotificationSettings
}

interface NotificationSettings {
  novoPedido: boolean
  pedidoAprovado: boolean
  pedidoEnviado: boolean
  carrinhoAbandonado: boolean
}

export default function ConfiguracoesRevendedora() {
  const supabase = createClientComponentClient()
  const [reseller, setReseller] = useState<ResellerData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQR, setLoadingQR] = useState(false)
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    novoPedido: true,
    pedidoAprovado: true,
    pedidoEnviado: true,
    carrinhoAbandonado: true
  })

  const checkWhatsAppStatus = useCallback(async (instanceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/status?instance=${instanceId}`)
      const data = await response.json()
      setWhatsappStatus(data.connected ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setWhatsappStatus('disconnected')
    }
  }, [])

  const loadUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: resellerData } = await supabase
          .from('resellers')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (resellerData) {
          setReseller(resellerData)
          
          // 🆕 Atualizar título da página para Google Analytics
          document.title = `Configurações - ${resellerData.store_name} | C4 Franquias`;
          
          if (resellerData.whatsapp_instance_id) {
            checkWhatsAppStatus(resellerData.whatsapp_instance_id)
          }
          if (resellerData.notification_settings) {
            setNotifications(resellerData.notification_settings)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, checkWhatsAppStatus])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  async function connectWhatsApp() {
    if (!reseller) return
    setLoadingQR(true)
    setWhatsappStatus('connecting')
    
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resellerId: reseller.id,
          instanceName: `reseller_${reseller.id}`
        })
      })
      
      const data = await response.json()
      
      if (data.qrcode) {
        setQrCode(data.qrcode)
        startConnectionPolling(data.instanceName)
      } else if (data.connected) {
        setWhatsappStatus('connected')
        setQrCode(null)
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setWhatsappStatus('disconnected')
    } finally {
      setLoadingQR(false)
    }
  }

  function startConnectionPolling(instance: string) {
    const currentStatus = whatsappStatus
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/status?instance=${instance}`)
        const data = await response.json()
        
        if (data.connected) {
          setWhatsappStatus('connected')
          setQrCode(null)
          clearInterval(interval)
          
          await supabase
            .from('resellers')
            .update({ whatsapp_instance_id: instance })
            .eq('id', reseller?.id)
        }
      } catch (error) {
        console.error('Erro no polling:', error)
      }
    }, 3000)
    
    setTimeout(() => {
      clearInterval(interval)
      if (currentStatus === 'connecting') {
        setWhatsappStatus('disconnected')
        setQrCode(null)
      }
    }, 120000)
  }

  async function disconnectWhatsApp() {
    if (!reseller?.whatsapp_instance_id) return
    
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: reseller.whatsapp_instance_id })
      })
      
      setWhatsappStatus('disconnected')
      
      await supabase
        .from('resellers')
        .update({ whatsapp_instance_id: null })
        .eq('id', reseller.id)
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }

  async function saveNotificationSettings() {
    if (!reseller) return
    
    try {
      await supabase
        .from('resellers')
        .update({ notification_settings: notifications })
        .eq('id', reseller.id)
      alert('Configurações salvas!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Configurações
      </h1>

      {/* Card de Em Construção */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-full">
            <Construction className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2">
              🚧 Funcionalidades em Desenvolvimento
            </h2>
            <p className="text-amber-800 mb-4">
              Estamos trabalhando em novas integrações e recursos para melhorar ainda mais sua experiência! 
              As seguintes funcionalidades estarão disponíveis em breve:
            </p>
            <div className="space-y-2 text-amber-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">• Integração com WhatsApp</span>
                <span className="text-xs bg-amber-200 px-2 py-1 rounded-full">Em breve</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="font-medium">• Notificações Personalizadas</span>
                <span className="text-xs bg-amber-200 px-2 py-1 rounded-full">Em breve</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">• Automações Avançadas</span>
                <span className="text-xs bg-amber-200 px-2 py-1 rounded-full">Em breve</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                💡 <strong>Enquanto isso:</strong> Você já pode usar todas as outras funcionalidades do painel 
                para gerenciar seus produtos, personalizar sua loja e acompanhar vendas!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards desabilitados com overlay */}
      <div className="relative mb-6">
        {/* Overlay de "Em breve" */}
        <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="bg-white rounded-full px-6 py-3 shadow-lg border-2 border-amber-500">
            <span className="font-bold text-amber-600 flex items-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" />
              Disponível em breve
            </span>
          </div>
        </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 opacity-60 pointer-events-none">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-600" />
          Conexão WhatsApp
        </h2>
        
        <p className="text-gray-600 mb-4">
          Conecte seu WhatsApp para receber notificações de pedidos, 
          carrinho abandonado e muito mais diretamente no seu celular.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className="font-medium">Status:</span>
          {whatsappStatus === 'connected' && (
            <span className="flex items-center gap-1 text-green-600">
              <Wifi className="w-4 h-4" /> Conectado
            </span>
          )}
          {whatsappStatus === 'connecting' && (
            <span className="flex items-center gap-1 text-yellow-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Conectando...
            </span>
          )}
          {whatsappStatus === 'disconnected' && (
            <span className="flex items-center gap-1 text-red-600">
              <WifiOff className="w-4 h-4" /> Desconectado
            </span>
          )}
        </div>

        {qrCode && whatsappStatus === 'connecting' && (
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-4">Escaneie o QR Code com seu WhatsApp:</p>
            <div className="bg-white p-4 rounded-lg shadow">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Abra o WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {whatsappStatus === 'disconnected' && (
            <button
              onClick={connectWhatsApp}
              disabled={loadingQR}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loadingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Conectar WhatsApp
            </button>
          )}
          
          {whatsappStatus === 'connecting' && (
            <button
              onClick={() => { setWhatsappStatus('disconnected'); setQrCode(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
          )}
          
          {whatsappStatus === 'connected' && (
            <>
              <button
                onClick={connectWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" /> Reconectar
              </button>
              <button
                onClick={disconnectWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" /> Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 opacity-60 pointer-events-none">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Notificações WhatsApp
        </h2>
        
        <p className="text-gray-600 mb-4">
          Escolha quais notificações você deseja receber no WhatsApp:
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifications.novoPedido}
              onChange={(e) => setNotifications({...notifications, novoPedido: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <div>
              <span className="font-medium">Novo Pedido</span>
              <p className="text-sm text-gray-500">Receba quando um cliente fizer um novo pedido</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifications.pedidoAprovado}
              onChange={(e) => setNotifications({...notifications, pedidoAprovado: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <div>
              <span className="font-medium">Pedido Aprovado</span>
              <p className="text-sm text-gray-500">Receba quando o pagamento for aprovado</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifications.pedidoEnviado}
              onChange={(e) => setNotifications({...notifications, pedidoEnviado: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <div>
              <span className="font-medium">Pedido Enviado</span>
              <p className="text-sm text-gray-500">Receba quando o pedido for despachado</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifications.carrinhoAbandonado}
              onChange={(e) => setNotifications({...notifications, carrinhoAbandonado: e.target.checked})}
              className="w-5 h-5 rounded"
            />
            <div>
              <span className="font-medium">Carrinho Abandonado</span>
              <p className="text-sm text-gray-500">Receba quando um cliente abandonar o carrinho</p>
            </div>
          </label>
        </div>

        <button
          onClick={saveNotificationSettings}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Salvar Configurações
        </button>
      </div>
      </div>
    </div>
  )
}
