'use client';

/**
 * 🖼️ PRODUCT GALLERY - Galeria de Imagens Otimizada
 * 
 * Utiliza Embla Carousel para swipe ultra fluido
 * - Mobile-first com dragFree para física natural
 * - next/image otimizado com priority e sizes
 * - Sem thumbnails - navegação apenas por swipe
 * - Aspect ratio adaptável à imagem
 * 
 * @author C4 Franquias
 */

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
}

export default function ProductGallery({ 
  images, 
  productName,
  borderRadius = 'medium'
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Embla Carousel com física fluida
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: images.length > 1,
    dragFree: false, // false = snap to slides (melhor UX)
    skipSnaps: false,
    containScroll: 'trimSnaps',
    // Física mais suave para mobile
    duration: 25,
  });

  // Atualizar índice quando mudar slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Border radius baseado na config
  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'none': return '0px';
      case 'small': return '8px';
      case 'large': return '24px';
      default: return '16px';
    }
  };

  // Fallback se não houver imagens
  if (!images || images.length === 0) {
    return (
      <div 
        className="relative w-full bg-gray-100 flex items-center justify-center"
        style={{ 
          aspectRatio: '3/4',
          borderRadius: getBorderRadius()
        }}
      >
        <span className="text-gray-400">Sem imagem</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Container do Carousel */}
      <div 
        className="overflow-hidden touch-pan-y"
        ref={emblaRef}
        style={{ borderRadius: getBorderRadius() }}
      >
        <div className="flex">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0"
              style={{ aspectRatio: '3/4' }}
            >
              <Image
                src={src}
                alt={`${productName} - Imagem ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                quality={index === 0 ? 90 : 80}
                priority={index === 0} // Apenas primeira imagem com priority
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de página (dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                selectedIndex === index 
                  ? 'w-8 bg-white' 
                  : 'w-1.5 bg-white/50'
              }`}
              aria-label={`Ver imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Contador discreto no canto */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full z-10">
          {selectedIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
