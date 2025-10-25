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
  const corTexto = loja.cor_texto || '#1F2937';

  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto px-4">
        <h2 
          className="font-bold text-center mb-6"
          style={{ 
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            color: corTexto
          }}
        >
          Categorias
        </h2>
        
        {/* Grid Único para Mobile e Desktop - 1 linha */}
        <div className="categories-grid">
          {categorias.map((cat) => (
            <Link 
              key={cat.id}
              href={`/loja/${loja.dominio}/produtos?categoria=${cat.slug}`}
              className="category-item"
            >
              <div 
                className="category-circle"
                style={{
                  borderColor: `${corPrimaria}40`
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
                style={{ color: corTexto }}
              >
                {cat.nome}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* Grid harmônico em 1 linha - Mobile e Desktop */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(10px, 3vw, 36px);
          justify-items: center;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Item de categoria */
        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          width: 100%;
          transition: transform 0.3s ease;
        }

        .category-item:hover {
          transform: translateY(-4px);
        }

        .category-item:active {
          transform: scale(0.95);
        }

        /* Bolinha circular - tamanho ajustado para mobile */
        .category-circle {
          width: clamp(70px, 18vw, 110px);
          height: clamp(70px, 18vw, 110px);
          border-radius: 9999px;
          overflow: hidden;
          border-width: 3px;
          border-style: solid;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
          flex-shrink: 0;
        }

        .category-item:hover .category-circle {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.18);
          transform: scale(1.05);
        }

        /* Label - texto maior e centralizado */
        .category-label {
          margin-top: clamp(6px, 2vw, 12px);
          font-size: clamp(0.75rem, 2.8vw, 0.95rem);
          font-weight: 600;
          line-height: 1.3;
          word-wrap: break-word;
          max-width: 100%;
          display: block;
          text-align: center;
        }

        /* Responsivo para telas muito pequenas */
        @media (max-width: 360px) {
          .categories-grid {
            gap: 8px;
            padding: 0 12px;
          }
          
          .category-circle {
            width: clamp(65px, 17vw, 75px);
            height: clamp(65px, 17vw, 75px);
          }

          .category-label {
            font-size: 0.7rem;
            margin-top: 5px;
          }
        }

        /* Desktop - maior espaçamento e tamanhos */
        @media (min-width: 768px) {
          .categories-grid {
            max-width: 800px;
            gap: 44px;
          }

          .category-circle {
            width: clamp(110px, 12vw, 140px);
            height: clamp(110px, 12vw, 140px);
          }

          .category-label {
            font-size: clamp(0.95rem, 1.5vw, 1.1rem);
            margin-top: 14px;
          }
        }
      `}</style>
    </section>
  );
}
