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
      className="flex items-center justify-center gap-2 py-1.5 text-white overflow-hidden"
      style={{ backgroundColor: primaryColor }}
    >
      {/* Ícone de relógio ou fogo quando urgente */}
      <span className={`text-xs ${isUrgent ? 'animate-pulse' : ''}`}>
        {isUrgent ? '🔥' : '⏰'}
      </span>
      
      {/* Tempo formatado de forma limpa e "solta" */}
      <div className="flex items-center gap-1 text-[11px] md:text-xs font-bold tracking-wide">
        {/* Dias - só mostra se tiver */}
        {timeLeft.days > 0 && (
          <>
            <span className="tabular-nums">{timeLeft.days}</span>
            <span className="opacity-80 font-normal">d</span>
            <span className="opacity-50 mx-0.5">:</span>
          </>
        )}
        
        {/* Horas */}
        <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="opacity-80 font-normal">h</span>
        <span className="opacity-50 mx-0.5">:</span>
        
        {/* Minutos */}
        <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="opacity-80 font-normal">m</span>
        <span className="opacity-50 mx-0.5">:</span>
        
        {/* Segundos */}
        <span className={`tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="opacity-80 font-normal">s</span>
      </div>
      
      {/* Texto de urgência */}
      {isUrgent && (
        <span className="text-[10px] font-semibold animate-pulse">CORRE!</span>
      )}
    </div>
  );
}
