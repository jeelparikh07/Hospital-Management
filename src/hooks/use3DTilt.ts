'use client';

import { useRef, useCallback } from 'react';

interface TiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

export function use3DTilt(options: TiltOptions = {}) {
  const {
    maxTilt = 6,
    perspective = 800,
    scale = 1,
    speed = 300,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      elementRef.current.style.transition = `transform ${speed}ms ease`;
      elementRef.current.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    },
    [maxTilt, perspective, scale, speed]
  );

  const handleMouseLeave = useCallback(() => {
    if (!elementRef.current) return;

    elementRef.current.style.transition = `transform ${speed}ms ease`;
    elementRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, [speed]);

  return {
    ref: elementRef,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
