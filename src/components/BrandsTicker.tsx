'use client';

import React from 'react';

interface BrandItem {
  name: string;
  category: string;
  logoSvg: React.ReactNode;
}

const brands: BrandItem[] = [
  {
    name: 'Hostinger',
    category: 'Cloud Hosting',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 180 32" fill="none">
        <g transform="translate(0, 4) scale(1)">
          <path d="M16.415 0v7.16l5.785 3.384V2.949L16.415 0ZM1.8 0v11.237h18.815L14.89 8.09l-7.457-.003V3.024L1.8 0Zm14.615 20.894v-5.019l-7.514-.005c.007.033-5.82-3.197-5.82-3.197l19.119.091V24l-5.785-3.106ZM1.8 13.551v7.343l5.633 2.949v-6.988L1.8 13.551Z" fill="#673DE6" />
        </g>
        <text x="36" y="23" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="900" fill="#673DE6" letterSpacing="-0.5">HOSTINGER</text>
      </svg>
    ),
  },
  {
    name: 'MilesWeb',
    category: 'Web Infrastructure',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 170 32" fill="none">
        <rect x="0" y="2" width="28" height="28" rx="7" fill="#E31E24" />
        <path d="M6 22V10l6 6 6-6v12" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="36" y="23" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="900" fill="#E31E24" letterSpacing="-0.3">MilesWeb</text>
      </svg>
    ),
  },
  {
    name: 'Serverbyt',
    category: 'High-Perf Servers',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 175 32" fill="none">
        <circle cx="14" cy="16" r="12" fill="#00D2FF" fillOpacity="0.15" stroke="#00D2FF" strokeWidth="2.5" />
        <circle cx="14" cy="16" r="4.5" fill="#00D2FF" />
        <path d="M14 4v4M14 24v4M4 16h4M24 16h4" stroke="#00D2FF" strokeWidth="2.5" strokeLinecap="round" />
        <text x="36" y="23" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="900" fill="#00D2FF" letterSpacing="0.5">SERVERBYT</text>
      </svg>
    ),
  },
  {
    name: 'AWS',
    category: 'Cloud Infrastructure',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 130 32" fill="none">
        <text x="2" y="20" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="900" fill="#FF9900">aws</text>
        <path d="M5 25c12 5 30 5 40-2" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
        <path d="M43 21l5 3-4 4" fill="#FF9900" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'DigitalOcean',
    category: 'Cloud Compute',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 185 32" fill="none">
        <g transform="translate(0, 4) scale(1)">
          <path d="M12.04 0C5.408-.02.005 5.37.005 11.992h4.638c0-4.923 4.882-8.731 10.064-6.855a6.95 6.95 0 014.147 4.148c1.889 5.177-1.924 10.055-6.84 10.064v-4.61H7.391v4.623h4.61V24c7.86 0 13.967-7.588 11.397-15.83-1.115-3.59-3.985-6.446-7.575-7.575A12.8 12.8 0 0012.039 0zM7.39 19.362H3.828v3.564H7.39zm-3.563 0v-2.978H.85v2.978z" fill="#0080FF" />
        </g>
        <text x="32" y="22" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="800" fill="#0080FF">DigitalOcean</text>
      </svg>
    ),
  },
  {
    name: 'Cloudflare',
    category: 'CDN & Security',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 175 32" fill="none">
        <g transform="translate(0, 4) scale(1)">
          <path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" fill="#F38020" />
        </g>
        <text x="34" y="22" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="900" fill="#F38020" letterSpacing="-0.5">CLOUDFLARE</text>
      </svg>
    ),
  },
  {
    name: 'Vercel',
    category: 'Deployment Platform',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 145 32" fill="none">
        <g transform="translate(0, 4) scale(1)">
          <path d="m12 1.608 12 20.784H0Z" fill="#FFFFFF" />
        </g>
        <text x="32" y="22" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="21" fontWeight="800" fill="#FFFFFF">Vercel</text>
      </svg>
    ),
  },
  {
    name: 'Google Cloud',
    category: 'Enterprise Cloud',
    logoSvg: (
      <svg className="h-8 w-auto" viewBox="0 0 190 32" fill="none">
        <g transform="translate(0, 4) scale(1)">
          <path d="M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-2.821-4.552l-.043.043.006-.05A9.344 9.344 0 0 0 12.19 2.38zm-.358 4.146c1.244-.04 2.518.368 3.486 1.15a5.186 5.186 0 0 1 1.862 4.078v.518c3.53-.07 3.53 5.262 0 5.193h-5.193l-.008.009v-.04H6.785a2.59 2.59 0 0 1-1.067-.23h.001a2.597 2.597 0 1 1 3.437-3.437l3.013-3.012A6.747 6.747 0 0 0 8.11 8.24c.018-.01.04-.026.054-.023a5.186 5.186 0 0 1 3.67-1.69z" fill="#4285F4" />
        </g>
        <text x="32" y="22" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="800" fill="#4285F4">Google Cloud</text>
      </svg>
    ),
  },
];

export default function BrandsTicker() {
  // Duplicate array for seamless infinite looping
  const tickerItems = [...brands, ...brands, ...brands];

  return (
    <section className="py-14 bg-gradient-to-b from-white via-violet-50/20 to-white border-y border-violet-100 relative overflow-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-violet-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center space-y-2 relative z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
          Infrastructure & Cloud Partners
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Powered By Industry-Leading Platforms
        </h3>
      </div>

      {/* Infinite Ticker Track */}
      <div className="relative w-full overflow-hidden flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex gap-12 sm:gap-16 items-center whitespace-nowrap animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused]">
          {tickerItems.map((brand, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all duration-300 cursor-pointer min-w-[180px]"
            >
              {/* Logo with Grayscale to Original Color transition on hover */}
              <div className="filter grayscale contrast-75 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                {brand.logoSvg}
              </div>
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-violet-600 mt-2 uppercase tracking-wider transition-colors">
                {brand.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation Keyframes */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </section>
  );
}
