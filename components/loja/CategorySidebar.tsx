"use client";
import { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLojaInfo } from '@/contexts/LojaContext';

const mockCategorias = [
  { id: '1', nome: 'Calçados', subcategorias: ['Tênis', 'Sandálias', 'Sapatilhas', 'Botas'] },
  { id: '2', nome: 'Bolsas', subcategorias: ['Bolsas de Mão', 'Mochilas', 'Carteiras'] },
  { id: '3', nome: 'Acessórios', subcategorias: ['Cintos', 'Óculos', 'Bijuterias'] },
  { id: '4', nome: 'Roupas', subcategorias: ['Vestidos', 'Blusas', 'Calças'] },
  { id: '5', nome: 'Promoções', subcategorias: [] },
];

export default function CategorySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const loja = useLojaInfo();

  if (!loja) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Abrir menu de categorias"
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b" 
          style={{ backgroundColor: loja.cor_primaria }}
        >
          <h2 className="text-white font-bold text-lg">Categorias</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Fechar menu"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Lista de Categorias */}
        <nav className="overflow-y-auto h-[calc(100%-64px)] py-2">
          {mockCategorias.map((cat) => (
            <div key={cat.id}>
              <div 
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
              >
                <Link 
                  href={`/loja/${loja.dominio}/produtos?categoria=${cat.nome.toLowerCase()}`}
                  className="flex-1 font-medium text-gray-800 hover:text-pink-600 transition-colors"
                  onClick={(e) => {
                    if (cat.subcategorias.length > 0) {
                      e.preventDefault();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                >
                  {cat.nome}
                </Link>
                {cat.subcategorias.length > 0 && (
                  <ChevronRight 
                    size={20} 
                    className={`transition-transform duration-200 ${
                      expandedCategory === cat.id ? 'rotate-90' : ''
                    }`} 
                  />
                )}
              </div>

              {/* Subcategorias */}
              {cat.subcategorias.length > 0 && expandedCategory === cat.id && (
                <div className="bg-gray-50 border-l-2 border-pink-500">
                  {cat.subcategorias.map((sub, i) => (
                    <Link 
                      key={i}
                      href={`/loja/${loja.dominio}/produtos?subcategoria=${sub.toLowerCase()}`}
                      className="block px-8 py-2 text-sm text-gray-600 hover:text-pink-600 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
