"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  imagem: string;
}

export default function CategoriesStories() {
  const loja = useLojaInfo();
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    if (!loja) return;

    const fetchCategorias = async () => {
      try {
        const response = await fetch(`/api/loja/${loja.dominio}/categorias`);
        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };

    fetchCategorias();
  }, [loja]);

  if (!loja || categorias.length === 0) return null;

  const corPrimaria = loja.cor_primaria || '#DB1472';

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <h2 
          className="font-bold text-center mb-6"
          style={{ 
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            color: corPrimaria
          }}
        >
          Categorias
        </h2>
        
        {/* Carrossel Horizontal - Linha Única */}
        <div className="categories-carousel-wrapper">
          <div className="categories-carousel">
            {categorias.map((cat) => (
              <Link 
                key={cat.id}
                href={`/loja/${loja.dominio}/produtos?categoria=${cat.slug}`}
                className="category-item"
              >
                <div 
                  className="category-circle"
                  style={{
                    borderColor: corPrimaria
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
                <p 
                  className="category-label"
                  style={{ color: corPrimaria }}
                >
                  {cat.nome}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Wrapper do Carrossel */
        .categories-carousel-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        /* Carrossel Horizontal - Linha Única */
        .categories-carousel {
          display: flex;
          flex-direction: row;
          gap: clamp(20px, 4vw, 32px);
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          padding: 10px 8px 20px 8px;
          
          /* Ocultar scrollbar mantendo funcionalidade */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }

        /* Ocultar scrollbar Webkit (Chrome, Safari) */
        .categories-carousel::-webkit-scrollbar {
          display: none;
        }

        /* Item de categoria */
        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .category-item:hover {
          transform: translateY(-4px);
        }

        .category-item:active {
          transform: scale(0.95);
        }

        /* Bolinha circular - MAIORES e com borda sutil */
        .category-circle {
          width: clamp(90px, 22vw, 130px);
          height: clamp(90px, 22vw, 130px);
          border-radius: 9999px;
          overflow: hidden;
          border-width: 1px; /* Borda fina e sutil */
          border-style: solid;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .category-item:hover .category-circle {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
          transform: scale(1.08);
        }

        /* Label - texto maior e centralizado */
        .category-label {
          margin-top: clamp(8px, 2.5vw, 14px);
          font-size: clamp(0.8rem, 3vw, 1rem);
          font-weight: 600;
          line-height: 1.3;
          word-wrap: break-word;
          max-width: clamp(90px, 22vw, 130px);
          display: block;
          text-align: center;
        }

        /* Desktop - ícones ainda maiores */
        @media (min-width: 768px) {
          .categories-carousel {
            gap: 40px;
            padding: 12px 16px 24px 16px;
            justify-content: center;
          }

          .category-circle {
            width: clamp(130px, 14vw, 160px);
            height: clamp(130px, 14vw, 160px);
          }

          .category-label {
            font-size: clamp(1rem, 1.6vw, 1.15rem);
            margin-top: 16px;
            max-width: clamp(130px, 14vw, 160px);
          }
        }
      `}</style>
    </section>
  );
}
