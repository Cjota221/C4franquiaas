"use client";
import { Bell, User } from 'lucide-react';

export default function HeaderRevendedora() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 lg:ml-64">
          <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">Bem-vinda!</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
          </button>
          <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-pink-600" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}