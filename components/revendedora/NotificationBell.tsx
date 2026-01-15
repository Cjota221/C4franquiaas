'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Check, Package, Image as ImageIcon, DollarSign, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'new_products' | 'banner_approved' | 'banner_rejected' | 'sale' | 'low_stock'
  title: string
  message: string
  metadata: Record<string, unknown>
  read: boolean
  read_at: string | null
  action_url: string | null
  action_label: string | null
  created_at: string
}

const getIcon = (type: string) => {
  switch (type) {
    case 'new_products': return <Package className="w-5 h-5 text-blue-500" />
    case 'banner_approved': return <ImageIcon className="w-5 h-5 text-green-500" />
    case 'banner_rejected': return <ImageIcon className="w-5 h-5 text-red-500" />
    case 'sale': return <DollarSign className="w-5 h-5 text-green-500" />
    case 'low_stock': return <AlertTriangle className="w-5 h-5 text-orange-500" />
    default: return <Bell className="w-5 h-5 text-gray-500" />
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [resellerId, setResellerId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadResellerId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resellerId) {
      loadNotifications()
      
      // Realtime subscription para novas notificações
      const channel = supabase
        .channel('reseller_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reseller_notifications',
            filter: `reseller_id=eq.${resellerId}`
          },
          () => {
            loadNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resellerId])

  async function loadResellerId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (data) setResellerId(data.id)
    }
  }

  async function loadNotifications() {
    if (!resellerId) return

    const { data } = await supabase
      .from('reseller_notifications')
      .select('*')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  async function markAsRead(id: string) {
    await supabase
      .from('reseller_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    loadNotifications()
  }

  async function markAllAsRead() {
    if (!resellerId) return

    await supabase
      .from('reseller_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('reseller_id', resellerId)
      .eq('read', false)

    loadNotifications()
  }

  async function deleteNotification(id: string) {
    await supabase
      .from('reseller_notifications')
      .delete()
      .eq('id', id)

    loadNotifications()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />

          {/* Painel de notificações */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone */}
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Marcar como lida"
                                >
                                  <Check className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Excluir"
                              >
                                <X className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>

                          {/* Link de ação */}
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => {
                                markAsRead(notification.id)
                                setIsOpen(false)
                              }}
                              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {notification.action_label || 'Ver detalhes'} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
