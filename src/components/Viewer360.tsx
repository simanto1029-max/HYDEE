import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rotate3D, Loader2 } from 'lucide-react';

interface Viewer360Props {
  frames: string[];
  productName: string;
  className?: string;
  autoRotate?: boolean;
}

export const Viewer360: React.FC<Viewer360Props> = ({
  frames,
  productName,
  className = '',
  autoRotate = false,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload all 360 frames
  useEffect(() => {
    if (!frames || frames.length === 0) return;
    setIsLoading(true);
    setLoadedImagesCount(0);

    let loaded = 0;
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        setLoadedImagesCount(loaded);
        if (loaded >= frames.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedImagesCount(loaded);
        if (loaded >= frames.length) {
          setIsLoading(false);
        }
      };
    });
  }, [frames]);

  // Optional subtle auto-rotation on mount
  useEffect(() => {
    if (!autoRotate || isDragging || isLoading || frames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, 250);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging, isLoading, frames.length]);

  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!isDragging || frames.length <= 1) return;
      const deltaX = clientX - startX;
      const sensitivity = 22; // Pixels per frame change

      if (Math.abs(deltaX) >= sensitivity) {
        const framesToShift = Math.floor(deltaX / sensitivity);
        const newIndex = (currentFrameIndex - framesToShift + frames.length * 10) % frames.length;
        setCurrentFrameIndex(newIndex);
        setStartX(clientX);
      }
    },
    [isDragging, startX, currentFrameIndex, frames.length]
  );

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!frames || frames.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-neutral-100 text-neutral-400 text-xs">
        No 360° frames available
      </div>
    );
  }

  const currentFrame = frames[currentFrameIndex] || frames[0];

  return (
    <div
      ref={containerRef}
      className={`relative select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
    >
      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
          <Loader2 className="w-8 h-8 text-[#800000] animate-spin mb-2" />
          <span className="text-[11px] font-medium text-neutral-600">
            Buffering 360° ({loadedImagesCount}/{frames.length})...
          </span>
        </div>
      )}

      {/* Main 360 Image Display */}
      <img
        src={currentFrame}
        alt={`${productName} 360 view frame ${currentFrameIndex + 1}`}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
        draggable={false}
      />

      {/* 360 Overlay Badge & Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full pointer-events-none shadow-md">
        <Rotate3D className="w-3.5 h-3.5 text-[#800000] animate-spin" style={{ animationDuration: '6s' }} />
        <span>Drag 360° Rotate</span>
        <span className="text-neutral-400">·</span>
        <span className="text-neutral-300">
          {currentFrameIndex + 1}/{frames.length}
        </span>
      </div>
    </div>
  );
};
