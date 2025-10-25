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
  { nome: 'Perfumes', imagem: 'https://placehold.co/100x100/10b981/ffffff?text=Perfumes' },
  { nome: 'Jóias', imagem: 'https://placehold.co/100x100/6366f1/ffffff?text=Jóias' },
  { nome: 'Relógios', imagem: 'https://placehold.co/100x100/f43f5e/ffffff?text=Relógios' },
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
          className="font-bold text-center mb-4 md:mb-6"
          style={{ 
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            color: corTexto
          }}
        >
          Categorias
        </h2>
        
        {/* MOBILE: Marquee Infinito */}
        <div className="mobile-marquee md:hidden">
          <div className="marquee-track">
            {/* Duplicação para loop infinito */}
            {[...mockCategorias, ...mockCategorias].map((cat, i) => (
              <Link 
                key={`${cat.nome}-${i}`}
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

        {/* DESKTOP: Grid Estático Centralizado */}
        <div className="desktop-grid hidden md:flex">
          {mockCategorias.map((cat, i) => (
            <Link 
              key={i}
              href={`/loja/${loja.dominio}/produtos?categoria=${cat.nome.toLowerCase()}`}
              className="category-item-desktop"
            >
              <div 
                className="category-circle-desktop"
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
                className="category-label-desktop"
                style={{ color: corTexto }}
              >
                {cat.nome}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ============================================
           MOBILE: Animação Marquee Infinita
           ============================================ */
        .mobile-marquee {
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }

        .marquee-track {
          display: inline-flex;
          gap: clamp(16px, 4vw, 24px);
          animation: marquee-scroll 40s linear infinite;
          padding: 8px 0;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Categoria Item - Mobile */
        .category-item {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .category-item:active {
          transform: scale(0.95);
        }

        /* Bolinha Circular - Mobile */
        .category-circle {
          width: clamp(70px, 15vw, 90px);
          height: clamp(70px, 15vw, 90px);
          border-radius: 9999px;
          overflow: hidden;
          border-width: 3px;
          border-style: solid;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .category-item:active .category-circle {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.05);
        }

        /* Label - Mobile */
        .category-label {
          margin-top: clamp(6px, 1.5vw, 10px);
          font-size: clamp(0.75rem, 2.5vw, 0.875rem);
          font-weight: 500;
          white-space: normal;
          word-wrap: break-word;
          max-width: clamp(70px, 15vw, 90px);
          line-height: 1.2;
        }

        /* ============================================
           DESKTOP: Grid Estático Centralizado
           ============================================ */
        .desktop-grid {
          justify-content: center;
          flex-wrap: wrap;
          gap: clamp(24px, 3vw, 40px);
          padding: 12px 0;
        }

        /* Categoria Item - Desktop */
        .category-item-desktop {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .category-item-desktop:hover {
          transform: translateY(-4px);
        }

        /* Bolinha Circular - Desktop */
        .category-circle-desktop {
          width: clamp(90px, 8vw, 120px);
          height: clamp(90px, 8vw, 120px);
          border-radius: 9999px;
          overflow: hidden;
          border-width: 3px;
          border-style: solid;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .category-item-desktop:hover .category-circle-desktop {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transform: scale(1.08);
        }

        /* Label - Desktop */
        .category-label-desktop {
          margin-top: 10px;
          font-size: clamp(0.875rem, 1.2vw, 1rem);
          font-weight: 600;
          transition: opacity 0.3s ease;
        }

        .category-item-desktop:hover .category-label-desktop {
          opacity: 0.8;
        }

        /* Media Query para garantir separação */
        @media (max-width: 768px) {
          .desktop-grid {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-marquee {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
