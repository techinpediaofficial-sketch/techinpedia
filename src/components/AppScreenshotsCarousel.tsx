'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';

interface AppScreenshotsCarouselProps {
  screenshots: string[];
  title: string;
}

export default function AppScreenshotsCarousel({ screenshots, title }: AppScreenshotsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className="space-y-6 mb-16 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Google Play Store Gallery</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            App UI & User Experience Screenshots
          </h2>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Scroll or Swipe ({screenshots.length} Screens)
          </span>
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Phone Mockup Carousel Row */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-6 overflow-x-auto snap-x snap-mandatory py-6 px-1 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-violet-50"
        style={{ scrollbarWidth: 'thin' }}
      >
        {screenshots.map((imgUrl: string, idx: number) => (
          <div
            key={idx}
            className="flex-shrink-0 snap-center group relative w-60 sm:w-64 h-[440px] sm:h-[480px] rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-950 shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-violet-500 hover:shadow-[0_20px_50px_rgba(128,46,227,0.25)]"
          >
            {/* Phone Top Speaker & Notch */}
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-950 z-30 flex justify-center items-center">
              <div className="w-16 h-3 bg-slate-800 rounded-b-xl flex items-center justify-center">
                <div className="w-3 h-1 bg-slate-900 rounded-full" />
              </div>
            </div>

            {/* Screen Display Container */}
            <div className="relative w-full h-full pt-5 bg-slate-900">
              <Image
                src={imgUrl}
                alt={`${title} App Screen ${idx + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="absolute bottom-1 inset-x-0 h-3 z-30 flex justify-center items-center pointer-events-none">
              <div className="w-24 h-1 bg-slate-600/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
