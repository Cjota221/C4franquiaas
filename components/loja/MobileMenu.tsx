"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Home, Package, Info, Phone, User, ChevronRight } from 'lucide-react';

type MenuLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  dominio: string;
  lojaNome: string;
  corPrimaria: string;
}

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  dominio, 
  lojaNome,
  corPrimaria 
}: MobileMenuProps) {
  // Previne scroll do body quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuLinks: MenuLink[] = [
    { href: '', label: 'Início', icon: Home },
    { href: '/produtos', label: 'Produtos', icon: Package },
    { href: '/sobre', label: 'Sobre', icon: Info },
    { href: '/contato', label: 'Contato', icon: Phone },
  ];

  return (
    <>
      {/* Overlay (backdrop) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer lateral (slide-in from left) */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navegação mobile"
      >
        {/* Header do Menu */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-200"
          style={{ backgroundColor: `${corPrimaria}10` }}
        >
          <h2 
            className="text-lg font-bold"
            style={{ color: corPrimaria }}
          >
            {lojaNome}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar menu"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex flex-col p-4 gap-2">
          {/* Link de Login */}
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${corPrimaria}20` }}
              >
                <User 
                  size={20} 
                  style={{ color: corPrimaria }}
                />
              </div>
              <span className="font-medium text-gray-900">Minha Conta</span>
            </div>
            <ChevronRight 
              size={20} 
              className="text-gray-400 group-hover:text-gray-600 transition-colors" 
            />
          </Link>

          {/* Divider */}
          <div className="h-px bg-gray-200 my-2" />

          {/* Links do Menu */}
          {menuLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`/loja/${dominio}${href}`}
              onClick={onClose}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100"
                >
                  <Icon size={20} className="text-gray-700" />
                </div>
                <span className="font-medium text-gray-900">{label}</span>
              </div>
              <ChevronRight 
                size={20} 
                className="text-gray-400 group-hover:text-gray-600 transition-colors" 
              />
            </Link>
          ))}
        </nav>

        {/* Footer do Menu */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} {lojaNome}
          </p>
        </div>
      </aside>
    </>
  );
}
