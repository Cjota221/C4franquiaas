/**
 * Barra de Busca Minimalista
 * Design: Campo limpo, bordas arredondadas, ícone de lupa interno
 */

"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  dominio: string;
  placeholder?: string;
}

export function SearchBar({ dominio, placeholder = "Buscar produtos..." }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/loja/${dominio}/busca?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full px-4 py-3 bg-white border-b">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-black focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>
    </form>
  );
}
