"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SidebarFranqueada({ franqueadaNome }: { franqueadaNome: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/franqueada/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/franqueada/produtos', label: 'Meus Produtos', icon: Package },
    { href: '/franqueada/perfil', label: 'Meu Perfil', icon: User }
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/franqueada/login');
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-pink-600">C4 Franquias</h1>
        <p className="text-sm text-gray-600 mt-1">{franqueadaNome}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
