'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import VideoTutorialButton from '@/components/VideoTutorialButton'
import { 
  ShoppingCart, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'

interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  product_price: number
  quantity: number
  variation_name: string | null
  added_at: string
}

interface AbandonedCart {
  id: string
  customer_name: string | null
  customer_phone: string
  customer_email: string | null
  status: 'abandoned' | 'recovered' | 'converted' | 'expired'
  total_value: number
  items_count: number
  created_at: string
  updated_at: string
  last_activity_at: string
  contacted: boolean
  contacted_at: string | null
  notes: string | null
  items: CartItem[]
}

export default function CarrinhosAbandonadosPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [resellerId, setResellerId] = useState<string | null>(null)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadCarts = async (rId: string) => {
    try {
      const response = await fetch(`/api/carrinho-abandonado?reseller_id=${rId}`)
      const data = await response.json()
      if (data.carts) {
        setCarts(data.carts)
      }
    } catch (err) {
      console.error('Erro ao buscar carrinhos:', err)
    }
  }

  const reloadCarts = async () => {
    if (resellerId) {
      await loadCarts(resellerId)
    }
  }

  useEffect(() => {
    const loadResellerAndCarts = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('Usuário não autenticado')
          setLoading(false)
          return
        }

        const { data: reseller, error: resellerError } = await supabase
          .from('resellers')
          .select('id, store_name')
          .eq('user_id', user.id)
          .single()

        if (resellerError || !reseller) {
          setError('Revendedora não encontrada')
          setLoading(false)
          return
        }

        // 🆕 Atualizar título da página para Google Analytics
        document.title = `Carrinhos Abandonados - ${reseller.store_name} | C4 Franquias`;

        setResellerId(reseller.id)
        await loadCarts(reseller.id)
      } catch (err) {
        console.error('Erro ao carregar:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadResellerAndCarts()
  }, [])

  const updateCartStatus = async (cartId: string, status: string) => {
    try {
      const response = await fetch('/api/carrinho-abandonado', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, status })
      })

      if (response.ok) {
        await reloadCarts()
        if (selectedCart?.id === cartId) {
          setSelectedCart(null)
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const markAsContacted = async (cartId: string) => {
    try {
      const response = await fetch('/api/carrinho-abandonado', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, contacted: true })
      })

      if (response.ok) {
        await reloadCarts()
      }
    } catch (err) {
      console.error('Erro ao marcar contato:', err)
    }
  }

  const deleteCart = async (cartId: string) => {
    if (!confirm('Tem certeza que deseja remover este carrinho?')) return

    try {
      const response = await fetch(`/api/carrinho-abandonado?cart_id=${cartId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await reloadCarts()
        if (selectedCart?.id === cartId) {
          setSelectedCart(null)
        }
      }
    } catch (err) {
      console.error('Erro ao deletar carrinho:', err)
    }
  }

  const filteredCarts = carts.filter(cart => {
    if (filter !== 'all' && cart.status !== filter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        cart.customer_name?.toLowerCase().includes(searchLower) ||
        cart.customer_phone.includes(search) ||
        cart.customer_email?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'abandoned':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Abandonado</span>
      case 'recovered':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Recuperado</span>
      case 'converted':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Convertido</span>
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Expirado</span>
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatWhatsApp = (phone: string, cart?: AbandonedCart) => {
    const cleaned = phone.replace(/\D/g, '')
    
    // Se não tiver carrinho, retorna link sem mensagem
    if (!cart) {
      return `https://wa.me/55${cleaned}`
    }
    
    // Monta mensagem personalizada
    const firstName = cart.customer_name?.split(' ')[0] || 'Cliente'
    
    let message = `Olá ${firstName}! 👋\n\n`
    message += `Vi que você deixou algumas peças no carrinho. Ficou alguma dúvida? 💬\n\n`
    
    // Lista os produtos
    if (cart.items && cart.items.length > 0) {
      message += `🛒 *Seu carrinho:*\n`
      cart.items.forEach((item) => {
        const variation = item.variation_name ? ` (${item.variation_name})` : ''
        message += `• ${item.product_name}${variation} - R$ ${item.product_price.toFixed(2)}\n`
      })
      message += `\n💰 *Total: R$ ${(cart.total_value || 0).toFixed(2)}*\n\n`
    }
    
    message += `Estou aqui para te ajudar! 😊`
    
    return `https://wa.me/55${cleaned}?text=${encodeURIComponent(message)}`
  }

  const stats = {
    total: carts.length,
    abandoned: carts.filter(c => c.status === 'abandoned').length,
    recovered: carts.filter(c => c.status === 'recovered').length,
    converted: carts.filter(c => c.status === 'converted').length,
    totalValue: carts.filter(c => c.status === 'abandoned').reduce((sum, c) => sum + (c.total_value || 0), 0)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-pink-500" />
          Carrinhos Abandonados
        </h1>
          <p className="text-gray-600 mt-1">
            Gerencie e recupere vendas de clientes que não finalizaram a compra
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total de Carrinhos</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Abandonados</div>
            <div className="text-2xl font-bold text-red-600">{stats.abandoned}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Recuperados/Convertidos</div>
            <div className="text-2xl font-bold text-green-600">{stats.recovered + stats.converted}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Valor Abandonado</div>
            <div className="text-2xl font-bold text-pink-600">
              R$ {stats.totalValue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="abandoned">Abandonados</option>
              <option value="recovered">Recuperados</option>
              <option value="converted">Convertidos</option>
              <option value="expired">Expirados</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm flex-1"
            />
          </div>

          <button
            onClick={() => reloadCarts()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Cart List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCarts.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum carrinho abandonado encontrado</p>
              <p className="text-sm mt-2">
                Quando clientes adicionarem produtos ao carrinho sem finalizar, aparecerão aqui.
              </p>
            </div>
          ) : (
            filteredCarts.map((cart) => (
              <div
                key={cart.id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${
                  selectedCart?.id === cart.id ? 'ring-2 ring-pink-500' : ''
                }`}
                onClick={() => setSelectedCart(cart)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-800">
                        {cart.customer_name || 'Cliente sem nome'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3" />
                        {cart.customer_phone}
                      </div>
                      {cart.customer_email && (
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {cart.customer_email}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(cart.status)}
                      <div className="text-lg font-bold text-pink-600 mt-2">
                        R$ {(cart.total_value || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(cart.last_activity_at)}
                    </div>
                    <div>
                      {cart.items_count} {cart.items_count === 1 ? 'item' : 'itens'}
                    </div>
                    {cart.contacted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Contatado
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <a
                      href={formatWhatsApp(cart.customer_phone, cart)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsContacted(cart.id)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                    
                    {cart.status === 'abandoned' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateCartStatus(cart.id, 'recovered')
                        }}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                        title="Marcar como recuperado"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCart(cart.id)
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                      title="Remover carrinho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Detail Modal */}
        {selectedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Detalhes do Carrinho
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedCart.customer_name || 'Cliente sem nome'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCart(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedCart.customer_phone}</span>
                  </div>
                  {selectedCart.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedCart.customer_email}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Itens no Carrinho ({selectedCart.items_count})
                  </h4>
                  <div className="space-y-2">
                    {selectedCart.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        {item.product_image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.product_name}</div>
                          {item.variation_name && (
                            <div className="text-xs text-gray-500">{item.variation_name}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Qtd: {item.quantity} × R$ {(item.product_price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-pink-600">
                          R$ {((item.product_price || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold border-t pt-4 mb-4">
                  <span>Total</span>
                  <span className="text-pink-600">
                    R$ {(selectedCart.total_value || 0).toFixed(2)}
                  </span>
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={formatWhatsApp(selectedCart.customer_phone, selectedCart)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsContacted(selectedCart.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar WhatsApp
                  </a>
                  
                  {selectedCart.status === 'abandoned' && (
                    <>
                      <button
                        onClick={() => {
                          updateCartStatus(selectedCart.id, 'recovered')
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Recuperado
                      </button>
                      <button
                        onClick={() => {
                          updateCartStatus(selectedCart.id, 'converted')
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Convertido
                      </button>
                    </>
                  )}
                </div>

                {/* Notes */}
                {selectedCart.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                    <strong>Notas:</strong> {selectedCart.notes}
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <div>Criado: {formatDate(selectedCart.created_at)}</div>
                  <div>Última atividade: {formatDate(selectedCart.last_activity_at)}</div>
                  {selectedCart.contacted_at && (
                    <div>Contatado em: {formatDate(selectedCart.contacted_at)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      
      <VideoTutorialButton pagina="carrinhos" />
    </div>
  )
}
