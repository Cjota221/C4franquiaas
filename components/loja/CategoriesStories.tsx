"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import Image from 'next/image';
import Link from 'next/link';

const categorias = [
  { nome: 'Rasteirinha', imagem: 'https://placehold.co/120x120/ec4899/ffffff?text=Rasteirinha' },
  { nome: 'Salto', imagem: 'https://placehold.co/120x120/8b5cf6/ffffff?text=Salto' },
  { nome: 'Papete/Flat', imagem: 'https://placehold.co/120x120/06b6d4/ffffff?text=Papete' },
  { nome: 'Bolsa', imagem: 'https://placehold.co/120x120/f59e0b/ffffff?text=Bolsa' },
];

export default function CategoriesStories() {
  const loja = useLojaInfo();

  if (!loja) return null;

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
          {categorias.map((cat, i) => (
            <Link 
              key={i}
              href={`/loja/${loja.dominio}/produtos?categoria=${cat.nome.toLowerCase()}`}
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
          gap: clamp(12px, 3vw, 24px);
          justify-items: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 0 8px;
        }

        /* Item de categoria */
        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
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

        /* Bolinha circular - tamanho harmônico */
        .category-circle {
          width: clamp(60px, 18vw, 100px);
          height: clamp(60px, 18vw, 100px);
          border-radius: 9999px;
          overflow: hidden;
          border-width: 3px;
          border-style: solid;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .category-item:hover .category-circle {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.05);
        }

        /* Label - texto harmônico */
        .category-label {
          margin-top: clamp(6px, 2vw, 10px);
          font-size: clamp(0.7rem, 2.5vw, 0.875rem);
          font-weight: 500;
          line-height: 1.2;
          word-wrap: break-word;
          max-width: 100%;
        }

        /* Responsivo para telas muito pequenas */
        @media (max-width: 360px) {
          .categories-grid {
            gap: 8px;
          }
          
          .category-label {
            font-size: 0.65rem;
          }
        }

        /* Desktop - maior espaçamento */
        @media (min-width: 768px) {
          .categories-grid {
            max-width: 700px;
            gap: 32px;
          }
        }
      `}</style>
    </section>
  );
}
