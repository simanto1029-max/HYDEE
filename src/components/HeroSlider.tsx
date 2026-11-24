import React, { useEffect, useRef, useState } from 'react';
import { HeroSlide } from '../types';

interface HeroSliderProps {
  // Only the banners the admin selected (Admin > Homepage). Nothing is created automatically.
  slides?: HeroSlide[];
  onNavigate: (path: string) => void;
}

// The picture is shown exactly as the admin uploaded it: full width, whole picture, no rounded corners,
// no border, no shadow, no dark overlay. "multiply" makes a pure white picture background melt into the
// page colour, so a banner with a white background looks like part of the website itself.
export const HeroSlider: React.FC<HeroSliderProps> = ({ slides = [], onNavigate }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;
  const slidesKey = slides.map((s) => `${s.id}|${s.desktopImage}|${s.mobileImage}`).join('~');

  // Auto-play only when there is more than one banner
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count, paused]);

  // Load every banner picture in the background so changing slides is instant
  useEffect(() => {
    slides.forEach((s) => {
      [s.desktopImage, s.mobileImage].forEach((src) => {
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey]);

  if (count === 0) return null;

  const slide = slides[safeIndex];
  const link = (slide.ctaLink || '').trim();
  // Text on the picture only appears when the admin switched it on (a banner that already contains its own text stays clean)
  const hasText =
    slide.showText === true &&
    Boolean((slide.title || '').trim() || (slide.subtitle || '').trim() || (slide.ctaText || '').trim());
  const heightKey = slide.height || 'compact';
  const heightClasses: Record<string, string> = {
    auto: '',
    compact: 'aspect-[2/1] sm:aspect-[3/1]',
    medium: 'aspect-[16/9] sm:aspect-[5/2]',
    tall: 'aspect-[4/3] sm:aspect-[2/1]',
  };
  const fixedHeight = heightKey !== 'auto';
  const dark = slide.textTheme === 'dark';

  const go = () => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(link.startsWith('/') ? link : `/${link}`);
    }
  };

  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  const alignClasses =
    slide.align === 'center'
      ? 'items-center text-center'
      : slide.align === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 50) {
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      <div
        className={`relative overflow-hidden ${heightClasses[heightKey] ?? heightClasses.compact} ${link ? 'cursor-pointer' : ''}`}
        onClick={go}
        role={link ? 'link' : undefined}
      >
        <picture key={slide.id} className={`block w-full ${fixedHeight ? 'h-full' : ''}`}>
          {slide.mobileImage && <source media="(max-width: 639px)" srcSet={slide.mobileImage} />}
          <img
            src={slide.desktopImage}
            alt={(slide.title || 'HYDEE').trim()}
            draggable={false}
            className={`block w-full mix-blend-multiply select-none ${
              fixedHeight ? 'h-full object-cover object-center' : 'h-auto'
            }`}
          />
        </picture>

        {hasText && (
          <div className={`absolute inset-0 flex flex-col justify-center gap-2 sm:gap-3 p-5 sm:p-10 lg:p-14 ${alignClasses}`}>
            {(slide.title || '').trim() && (
              <h2
                className={`font-sans text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight max-w-xl ${
                  dark ? 'text-neutral-950' : 'text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]'
                }`}
              >
                {slide.title}
              </h2>
            )}
            {(slide.subtitle || '').trim() && (
              <p
                className={`text-xs sm:text-sm lg:text-base leading-relaxed max-w-md ${
                  dark ? 'text-neutral-800' : 'text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]'
                }`}
              >
                {slide.subtitle}
              </p>
            )}
            {(slide.ctaText || '').trim() && (
              <span className="inline-block mt-1 bg-[#800000] text-white text-xs sm:text-sm font-bold px-6 py-2.5 sm:px-8 sm:py-3 rounded-full">
                {slide.ctaText}
              </span>
            )}
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === safeIndex ? 'w-6 bg-[#800000]' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
