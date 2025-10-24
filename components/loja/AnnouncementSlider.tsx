"use client";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AnnouncementSliderProps {
  messages: string[];
  backgroundColor: string;
  textColor?: string;
  autoPlayInterval?: number;
}

export default function AnnouncementSlider({ 
  messages, 
  backgroundColor,
  textColor = '#FFFFFF',
  autoPlayInterval = 4000
}: AnnouncementSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [messages.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  if (messages.length === 0) return null;

  return (
    <div 
      className="relative w-full py-2 overflow-hidden"
      style={{ backgroundColor }}
    >
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        {/* Botão Anterior (apenas se tiver múltiplas mensagens) */}
        {messages.length > 1 && (
          <button
            onClick={goToPrevious}
            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            aria-label="Mensagem anterior"
          >
            <ChevronLeft size={18} style={{ color: textColor }} />
          </button>
        )}

        {/* Mensagem Atual */}
        <div className="flex-1 text-center">
          <p 
            className="text-sm font-medium animate-fade-in"
            style={{ color: textColor }}
          >
            {messages[currentIndex]}
          </p>
        </div>

        {/* Botão Próximo (apenas se tiver múltiplas mensagens) */}
        {messages.length > 1 && (
          <button
            onClick={goToNext}
            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            aria-label="Próxima mensagem"
          >
            <ChevronRight size={18} style={{ color: textColor }} />
          </button>
        )}
      </div>

      {/* Indicadores (apenas se tiver múltiplas mensagens) */}
      {messages.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
          {messages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
              }`}
              aria-label={`Ir para mensagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
