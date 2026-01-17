'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Sparkles, Bug, AlertTriangle, Zap, Check, ChevronRight, X } from 'lucide-react'
import { useNotifications, SystemNotification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChangelogBellProps {
  audience?: 'all' | 'resellers' | 'admin'
  className?: string
}

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'Novidade'
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

export default function ChangelogBell({ audience = 'all', className = '' }: ChangelogBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotifications({ audience })

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBellClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const handleNotificationClick = (notification: SystemNotification) => {
    markAsRead(notification.id)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return ''
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
        aria-label="Notificações de novidades"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        
        {/* Badge de não lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Novidades</h3>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma novidade no momento</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.feature
                  const Icon = config.icon
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex gap-3">
                        {/* Ícone */}
                        <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-[10px] font-medium ${config.color} uppercase tracking-wide`}>
                                {config.label}
                              </span>
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mt-0.5">
                                {notification.title}
                              </h4>
                            </div>
                            {notification.high_priority && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded uppercase">
                                Importante
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {notification.description}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        
                        {/* Seta */}
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t text-center">
              <button className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                Ver todas as atualizações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
