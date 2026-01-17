/**
 * 🎯 useIntersectionObserver Hook
 * 
 * Controla play/pause de vídeos baseado na visibilidade.
 * O vídeo só toca quando está 100% visível na viewport.
 * 
 * @author C4 Franquias
 */

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLElement | null>;
  isVisible: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook para observar quando um elemento entra/sai da viewport
 */
export function useIntersectionObserver({
  threshold = 1.0, // 100% visível por padrão
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const ref = useRef<HTMLElement | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const frozen = freezeOnceVisible && isVisible;

  useEffect(() => {
    const node = ref.current;
    
    // Se não tem suporte ou elemento, retorna
    if (!node || typeof IntersectionObserver !== 'function' || frozen) {
      return;
    }

    const observerParams = { threshold, root, rootMargin };
    
    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
      setIsVisible(entry.isIntersecting);
    }, observerParams);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, frozen]);

  return { ref, isVisible, entry };
}

/**
 * Hook específico para controlar play/pause de vídeos
 */
export function useVideoVisibility(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: { threshold?: number; enabled?: boolean } = {}
) {
  const { threshold = 0.9, enabled = true } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          // Vídeo visível - dar play
          video.play().catch(() => {
            // Autoplay bloqueado pelo navegador - ok, usuário pode clicar
          });
          setIsPlaying(true);
        } else {
          // Vídeo não visível - pausar
          video.pause();
          setIsPlaying(false);
        }
      },
      {
        threshold: [0, 0.5, threshold, 1.0],
        rootMargin: '0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [videoRef, threshold, enabled]);

  return { containerRef, isPlaying };
}

export default useIntersectionObserver;
