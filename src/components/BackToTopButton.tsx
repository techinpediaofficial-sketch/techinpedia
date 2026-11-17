'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-24 right-7 z-40 select-none group"
        >
          <button
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="w-11 h-11 rounded-full bg-white/95 text-slate-700 border border-violet-200 shadow-[0_6px_20px_rgba(128,46,227,0.18)] hover:bg-violet-600 hover:text-white hover:border-violet-600 hover:shadow-[0_10px_25px_rgba(128,46,227,0.35)] transition-all duration-300 flex items-center justify-center backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
          
          {/* Subtle Hover Tooltip */}
          <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
            Back to top
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
