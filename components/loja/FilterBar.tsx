"use client";
import React, { useState } from 'react';
import { Filter, ArrowUpDown, Check } from 'lucide-react';
import FilterBottomSheet from './FilterBottomSheet';

interface FilterBarProps {
  corPrimaria: string;
  categorias: Array<{ id: string; nome: string; slug: string }>;
  tamanhos: string[];
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sortBy: SortOption) => void;
}

export interface FilterState {
  categorias: string[];
  tamanhos: string[];
}

export type SortOption = 'relevante' | 'preco-asc' | 'preco-desc';

const sortOptions = [
  { value: 'relevante' as SortOption, label: 'Mais relevantes' },
  { value: 'preco-asc' as SortOption, label: 'Menor preço' },
  { value: 'preco-desc' as SortOption, label: 'Maior preço' },
];

export default function FilterBar({
  corPrimaria,
  categorias,
  tamanhos,
  onFilterChange,
  onSortChange,
}: FilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    categorias: [],
    tamanhos: [],
  });
  
  const [selectedSort, setSelectedSort] = useState<SortOption>('relevante');

  // Aplicar filtros
  const applyFilters = () => {
    onFilterChange(selectedFilters);
    setFilterOpen(false);
  };

  // Limpar filtros
  const clearFilters = () => {
    const emptyFilters = { categorias: [], tamanhos: [] };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  // Toggle categoria
  const toggleCategoria = (slug: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      categorias: prev.categorias.includes(slug)
        ? prev.categorias.filter(c => c !== slug)
        : [...prev.categorias, slug],
    }));
  };

  // Toggle tamanho
  const toggleTamanho = (tamanho: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      tamanhos: prev.tamanhos.includes(tamanho)
        ? prev.tamanhos.filter(t => t !== tamanho)
        : [...prev.tamanhos, tamanho],
    }));
  };

  // Aplicar ordenação
  const applySort = (option: SortOption) => {
    setSelectedSort(option);
    onSortChange(option);
    setSortOpen(false);
  };

  const totalFilters = selectedFilters.categorias.length + selectedFilters.tamanhos.length;

  return (
    <>
      {/* Barra de Botões */}
      <div className="flex gap-3 mb-6">
        {/* Botão Filtrar */}
        <button
          onClick={() => setFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-full font-semibold transition-all hover:shadow-md active:scale-95"
          style={{
            borderColor: corPrimaria,
            color: corPrimaria,
          }}
        >
          <Filter size={18} />
          <span>Filtrar</span>
          {totalFilters > 0 && (
            <span 
              className="ml-1 px-2 py-0.5 rounded-full text-xs text-white font-bold"
              style={{ backgroundColor: corPrimaria }}
            >
              {totalFilters}
            </span>
          )}
        </button>

        {/* Botão Ordenar */}
        <button
          onClick={() => setSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-full font-semibold transition-all hover:shadow-md active:scale-95"
          style={{
            borderColor: corPrimaria,
            color: corPrimaria,
          }}
        >
          <ArrowUpDown size={18} />
          <span>Ordenar</span>
        </button>
      </div>

      {/* Bottom Sheet - Filtros */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrar Produtos"
      >
        {/* Categorias */}
        {categorias.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Categoria</h4>
            <div className="space-y-2">
              {categorias.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.categorias.includes(cat.slug)}
                    onChange={() => toggleCategoria(cat.slug)}
                    className="w-5 h-5 rounded accent-current"
                    style={{ accentColor: corPrimaria }}
                  />
                  <span className="text-gray-700">{cat.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tamanhos */}
        {tamanhos.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Tamanho</h4>
            <div className="grid grid-cols-4 gap-2">
              {tamanhos.map((tamanho) => (
                <button
                  key={tamanho}
                  onClick={() => toggleTamanho(tamanho)}
                  className="p-3 rounded-lg border-2 font-semibold transition-all"
                  style={{
                    borderColor: selectedFilters.tamanhos.includes(tamanho) ? corPrimaria : '#E5E7EB',
                    backgroundColor: selectedFilters.tamanhos.includes(tamanho) ? `${corPrimaria}15` : 'white',
                    color: selectedFilters.tamanhos.includes(tamanho) ? corPrimaria : '#4B5563',
                  }}
                >
                  {tamanho}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 pb-2 border-t border-gray-200 flex gap-3">
          <button
            onClick={clearFilters}
            className="flex-1 py-3 px-4 rounded-full border-2 font-semibold transition-all active:scale-95"
            style={{
              borderColor: '#E5E7EB',
              color: '#6B7280',
            }}
          >
            Limpar
          </button>
          <button
            onClick={applyFilters}
            className="flex-1 py-3 px-4 rounded-full font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: corPrimaria }}
          >
            Aplicar
          </button>
        </div>
      </FilterBottomSheet>

      {/* Bottom Sheet - Ordenação */}
      <FilterBottomSheet
        isOpen={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Ordenar por"
      >
        <div className="space-y-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => applySort(option.value)}
              className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span 
                className="font-semibold"
                style={{ 
                  color: selectedSort === option.value ? corPrimaria : '#374151' 
                }}
              >
                {option.label}
              </span>
              {selectedSort === option.value && (
                <Check size={20} style={{ color: corPrimaria }} />
              )}
            </button>
          ))}
        </div>
      </FilterBottomSheet>
    </>
  );
}
