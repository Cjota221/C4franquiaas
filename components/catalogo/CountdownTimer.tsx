"use client";
import { useEffect, useState } from 'react';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

type CountdownTimerProps = {
  endDate: string;
  primaryColor?: string;
};

export default function CountdownTimer({ endDate, primaryColor = '#ec4899' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      };
    };

    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.expired) return null;

  // Se menos de 1 hora, mostrar urgência
  const isUrgent = timeLeft.days === 0 && timeLeft.hours === 0;
  
  return (
    <div 
      className="flex items-center justify-center gap-1 py-1.5 text-white overflow-hidden"
      style={{ 
        background: isUrgent 
          ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
          : `linear-gradient(90deg, ${primaryColor} 0%, #8b5cf6 100%)` 
      }}
    >
      {/* Ícone animado de fogo quando urgente */}
      {isUrgent && (
        <span className="text-xs animate-pulse">🔥</span>
      )}
      
      <div className="flex items-center gap-0.5 text-[10px] md:text-xs font-bold">
        {/* Dias - só mostra se tiver */}
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center bg-white/20 rounded px-1.5 py-0.5 min-w-[28px]">
              <span className="text-sm md:text-base font-black tabular-nums leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[8px] uppercase opacity-80">dias</span>
            </div>
            <span className="text-white/60 font-light">:</span>
          </>
        )}
        
        {/* Horas */}
        <div className="flex flex-col items-center bg-white/20 rounded px-1.5 py-0.5 min-w-[28px]">
          <span className="text-sm md:text-base font-black tabular-nums leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[8px] uppercase opacity-80">hrs</span>
        </div>
        <span className="text-white/60 font-light">:</span>
        
        {/* Minutos */}
        <div className="flex flex-col items-center bg-white/20 rounded px-1.5 py-0.5 min-w-[28px]">
          <span className="text-sm md:text-base font-black tabular-nums leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[8px] uppercase opacity-80">min</span>
        </div>
        <span className="text-white/60 font-light">:</span>
        
        {/* Segundos - piscando quando urgente */}
        <div className={`flex flex-col items-center bg-white/20 rounded px-1.5 py-0.5 min-w-[28px] ${isUrgent ? 'animate-pulse' : ''}`}>
          <span className="text-sm md:text-base font-black tabular-nums leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[8px] uppercase opacity-80">seg</span>
        </div>
      </div>
      
      {/* Texto de urgência */}
      {isUrgent && (
        <span className="text-[10px] font-semibold ml-1 animate-pulse">CORRE!</span>
      )}
    </div>
  );
}
