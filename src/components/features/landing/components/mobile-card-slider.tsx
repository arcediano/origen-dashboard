'use client';

import { useRef, useState, useCallback } from 'react';

interface MobileCardSliderProps {
  children: React.ReactNode[];
  cardWidthClass?: string;
}

export function MobileCardSlider({
  children,
  cardWidthClass = 'w-[82vw] max-w-xs',
}: MobileCardSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIndex(index);
  }, []);

  const goTo = (index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
  };

  return (
    <div>
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-3 px-4"
      >
        {children.map((child, i) => (
          <div key={i} className={`snap-start flex-shrink-0 ${cardWidthClass}`}>
            {child}
          </div>
        ))}
      </div>

      {children.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a la tarjeta ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-origen-pradera w-6'
                  : 'bg-gray-300 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
