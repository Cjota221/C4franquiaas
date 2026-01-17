'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Sparkles, X, Bug, AlertTriangle, Zap, CheckCheck } from 'lucide-react'
import { useNotifications, SystemNotification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChangelogBellProps {
  audience?: 'all' | 'resellers' | 'admin'
}

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'Nova Funcionalidade'
  },
  fix: {
    icon: Bug,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'Correção'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    label: 'Alerta'
  },
  improvement: {
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Melhoria'
  }
}

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: SystemNotification
  onMarkAsRead: (id: string) => void 
}) {
  const config = typeConfig[notification.type] || typeConfig.feature
  const Icon = config.icon

  return (
    <div 
      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
              {notification.title}
            </h4>
            {notification.high_priority && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">
                NOVO
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
            {notification.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-medium ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChangelogBell({ audience = 'all' }: ChangelogBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications({ audience })

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  return (
    <div className="relative">
      {/* Botão do Sino */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge de notificações não lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Novidades</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Marcar lidas</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-white/80 mt-1">
                {unreadCount} {unreadCount === 1 ? 'novidade' : 'novidades'} para você
              </p>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma novidade no momento</p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">
                Clique em uma novidade para marcar como lida
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
