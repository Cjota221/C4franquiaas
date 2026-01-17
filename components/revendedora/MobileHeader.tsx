"use client";

import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, X, Sparkles, ChevronRight, CheckCheck, Bug, AlertTriangle, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useNotifications, SystemNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MobileHeaderProps {
  onMenuClick: () => void;
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
};

function NotificationItem({ 
  notification, 
  onMarkAsRead,
  onClose
}: { 
  notification: SystemNotification
  onMarkAsRead: (id: string) => void
  onClose: () => void 
}) {
  const config = typeConfig[notification.type] || typeConfig.feature;
  const Icon = config.icon;

  return (
    <div 
      className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => {
        onMarkAsRead(notification.id);
        onClose();
      }}
    >
      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {notification.title}
          </p>
          {notification.high_priority && (
            <span className="flex-shrink-0 text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              NOVO
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">
          {notification.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
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
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
    </div>
  );
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications({ audience: 'resellers' });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 safe-area-top">
      {/* Barra Principal */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Esquerda: Hamburger */}
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                     rounded-xl transition-all active:scale-95"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Centro: Logo em círculo com efeito 3D */}
          <Link href="/revendedora/dashboard" className="flex items-center">
            <div className="relative w-11 h-11 rounded-full bg-white 
                          border-2 border-gray-100
                          shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]
                          overflow-hidden flex items-center justify-center">
              <Image
                src="/logo-c4.png"
                alt="C4 Franquias"
                width={44}
                height={44}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Direita: Sino de Notificações */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="p-2 -mr-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                       rounded-xl transition-all active:scale-95 relative"
              aria-label="Novidades"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 rounded-full px-1 ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Novidades */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-32px)] 
                            bg-white rounded-2xl shadow-2xl border border-gray-100 
                            overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header do Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Novidades</span>
                    {unreadCount > 0 && (
                      <span className="text-xs text-white/80">
                        ({unreadCount} {unreadCount === 1 ? 'nova' : 'novas'})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lista de Novidades */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2" />
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
                        onMarkAsRead={markAsRead}
                        onClose={() => setShowNotifications(false)}
                      />
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-center text-xs text-gray-500">
                    Clique em uma novidade para marcar como lida 💖
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
