"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import Image from 'next/image';
import Link from 'next/link';

const mockCategorias = [
  { nome: 'Calçados', imagem: 'https://placehold.co/100x100/ec4899/ffffff?text=Calçados' },
  { nome: 'Bolsas', imagem: 'https://placehold.co/100x100/8b5cf6/ffffff?text=Bolsas' },
  { nome: 'Acessórios', imagem: 'https://placehold.co/100x100/06b6d4/ffffff?text=Acessórios' },
  { nome: 'Roupas', imagem: 'https://placehold.co/100x100/f59e0b/ffffff?text=Roupas' },
  { nome: 'Promoções', imagem: 'https://placehold.co/100x100/ef4444/ffffff?text=Promoções' },
];

export default function CategoriesStories() {
  const loja = useLojaInfo();

  if (!loja) return null;

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Categorias
        </h2>
        
        <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
          {mockCategorias.map((cat, i) => (
            <Link 
              key={i}
              href={`/loja/${loja.dominio}/produtos?categoria=${cat.nome.toLowerCase()}`}
              className="flex-shrink-0 text-center group"
            >
              <div 
                className="w-20 h-20 rounded-full overflow-hidden border-3 border-gray-200 group-hover:border-pink-500 transition-all duration-300 relative mx-auto shadow-md group-hover:shadow-lg"
                style={{
                  borderWidth: '3px',
                  borderColor: 'rgb(229, 231, 235)'
                }}
              >
                <Image 
                  src={cat.imagem} 
                  alt={cat.nome} 
                  fill 
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                {cat.nome}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
