"use client";

import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, X, Sparkles, ChevronRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

// Novidades do sistema (pode vir de uma API futuramente)
const systemNews = [
  {
    id: 1,
    title: '🎓 C4 Academy Lançado!',
    description: 'Aprenda a vender mais com nossos treinamentos exclusivos.',
    href: '/revendedora/academy',
    isNew: true,
    date: '15 Jan',
  },
  {
    id: 2,
    title: '📊 Sistema Lucro Certo',
    description: 'Calcule suas margens e controle seu financeiro.',
    href: 'https://sistemalucrocerto.com',
    external: true,
    isNew: true,
    date: '10 Jan',
  },
  {
    id: 3,
    title: '🎨 Editor de Banner Premium',
    description: 'Novo editor com preview em tempo real e templates.',
    href: '/revendedora/personalizacao',
    isNew: false,
    date: '05 Jan',
  },
  {
    id: 4,
    title: '📦 Produtos Novos Toda Semana',
    description: 'Fique de olho nos lançamentos da C4.',
    href: '/revendedora/produtos',
    isNew: false,
    date: '01 Jan',
  },
];

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (hasUnread) setHasUnread(false);
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

          {/* Centro: Logo */}
          <Link href="/revendedora/dashboard" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo-c4.png"
                alt="C4 Franquias"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-gray-900 text-lg">C4</span>
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
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-pink-500 rounded-full 
                               ring-2 ring-white animate-pulse" />
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
                    <span className="font-semibold">Novidades do Sistema</span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de Novidades */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {systemNews.map((news) => (
                    <Link
                      key={news.id}
                      href={news.href}
                      target={news.external ? '_blank' : undefined}
                      rel={news.external ? 'noopener noreferrer' : undefined}
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {news.title}
                          </p>
                          {news.isNew && (
                            <span className="flex-shrink-0 text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                              NOVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {news.description}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">{news.date}</p>
                      </div>
                      {news.external ? (
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      )}
                    </Link>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-center text-xs text-gray-500">
                    Fique ligada nas novidades! 💖
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
