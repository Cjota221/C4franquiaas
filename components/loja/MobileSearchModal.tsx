"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Package } from 'lucide-react';

type Suggestion = {
  id: string;
  nome: string;
  preco: number;
  imagem: string | null;
  categoria: string | null;
  codigo_barras: string | null;
};

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dominio: string;
  corPrimaria: string;
}

export default function MobileSearchModal({ 
  isOpen, 
  onClose, 
  dominio,
  corPrimaria 
}: MobileSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Previne scroll do body quando modal está aberto
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

  // Debounce para busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/loja/${dominio}/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('[MobileSearch] Erro:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSuggestions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-white md:hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fechar busca"
        >
          <X size={24} className="text-gray-700" />
        </button>

        {/* Campo de Busca */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você procura?"
              className="w-full rounded-full border border-gray-300 py-3 px-4 pr-10 text-base outline-none transition focus:border-2"
              style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                borderColor: searchQuery ? corPrimaria : undefined,
              }}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300"
                  style={{ borderTopColor: corPrimaria }}
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Resultados */}
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        {suggestions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion.id}
                href={`/loja/${dominio}/produto/${suggestion.id}`}
                onClick={handleClose}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {/* Imagem */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {suggestion.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={suggestion.imagem}
                      alt={suggestion.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={24} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">
                    {suggestion.nome}
                  </h4>
                  {suggestion.categoria && (
                    <p className="text-xs text-gray-500 mt-1">
                      {suggestion.categoria}
                    </p>
                  )}
                </div>

                {/* Preço */}
                <div className="flex-shrink-0">
                  <p 
                    className="text-sm font-bold"
                    style={{ color: corPrimaria }}
                  >
                    R$ {suggestion.preco.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </Link>
            ))}

            {/* Ver todos */}
            <Link
              href={`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`}
              onClick={handleClose}
              className="block p-4 text-center font-medium transition-colors hover:bg-gray-50"
              style={{ color: corPrimaria }}
            >
              Ver todos os resultados →
            </Link>
          </div>
        ) : searchQuery.trim() && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Nenhum resultado encontrado para &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Digite para buscar produtos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
