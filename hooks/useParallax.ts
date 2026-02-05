'use client';

import { useEffect, useState, useRef, RefObject } from 'react';

interface ParallaxOptions {
  speed?: number; // 0-1, where 0.5 = 50% of scroll speed (default: 0.3)
  direction?: 'up' | 'down'; // 'up' moves opposite to scroll, 'down' moves with scroll
  disabled?: boolean; // disable parallax (e.g., for reduced motion)
}

interface ParallaxReturn {
  ref: RefObject<HTMLDivElement | null>;
  style: {
    transform: string;
    willChange: string;
  };
  offset: number;
}

export function useParallax(options: ParallaxOptions = {}): ParallaxReturn {
  const { speed = 0.3, direction = 'up', disabled = false } = options;
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    if (disabled) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how far the element is from the center of the viewport
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = windowHeight / 2;
            const distanceFromCenter = elementCenter - viewportCenter;

            // Apply parallax based on distance from viewport center
            const parallaxOffset = distanceFromCenter * speed;
            setOffset(direction === 'up' ? -parallaxOffset : parallaxOffset);
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Initial calculation
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [speed, direction, disabled]);

  return {
    ref,
    style: {
      transform: disabled ? 'none' : `translateY(${offset}px)`,
      willChange: disabled ? 'auto' : 'transform',
    },
    offset,
  };
}

// Simpler hook for background images - returns just the transform value
export function useBackgroundParallax(speed: number = 0.4): {
  containerRef: RefObject<HTMLDivElement | null>;
  imageStyle: React.CSSProperties;
} {
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Only apply parallax when element is visible
            if (rect.bottom > 0 && rect.top < windowHeight) {
              // Calculate parallax based on scroll position relative to element
              const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
              const maxOffset = rect.height * speed;
              const offset = (scrollProgress - 0.5) * maxOffset;
              setTranslateY(offset);
            }
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [speed]);

  return {
    containerRef,
    imageStyle: {
      transform: `translateY(${translateY}px) scale(1.1)`,
      willChange: 'transform',
    },
  };
}
