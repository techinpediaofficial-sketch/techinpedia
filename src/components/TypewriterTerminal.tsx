'use client';

import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface TerminalLine {
  text: string;
  className: string;
  prefix?: string;
  prefixColor?: string;
}

const linesConfig: TerminalLine[] = [
  {
    prefix: '$ ',
    prefixColor: 'text-violet-600 font-bold',
    text: 'techinpedia --provision --deploy',
    className: 'text-violet-700 font-bold',
  },
  {
    prefix: '→ ',
    prefixColor: 'text-violet-500 font-bold',
    text: 'Hardware: MacBook Pro M3 & RTX 4090 Rigs Ready',
    className: 'text-slate-700',
  },
  {
    prefix: '✓ ',
    prefixColor: 'text-emerald-600 font-bold',
    text: 'Software: Next.js 16 + React 19 + AWS Active',
    className: 'text-emerald-700 font-semibold',
  },
  {
    prefix: '✓ ',
    prefixColor: 'text-purple-600 font-bold',
    text: 'Marketing: Meta & Google Campaigns Synchronized',
    className: 'text-purple-700 font-semibold',
  },
];

export default function TypewriterTerminal() {
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<{ prefix?: string; prefixColor?: string; text: string; className: string }[]>([]);

  useEffect(() => {
    if (currentLineIdx >= linesConfig.length) {
      // Pause for 4 seconds after complete typing, then reset
      const resetTimeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIdx(0);
        setCurrentCharIdx(0);
      }, 4000);
      return () => clearTimeout(resetTimeout);
    }

    const currentTargetLine = linesConfig[currentLineIdx];
    const fullText = currentTargetLine.text;

    if (currentCharIdx < fullText.length) {
      const charTimer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          const typedText = fullText.slice(0, currentCharIdx + 1);

          if (!updated[currentLineIdx]) {
            updated[currentLineIdx] = {
              prefix: currentTargetLine.prefix,
              prefixColor: currentTargetLine.prefixColor,
              text: typedText,
              className: currentTargetLine.className,
            };
          } else {
            updated[currentLineIdx] = {
              ...updated[currentLineIdx],
              text: typedText,
            };
          }
          return updated;
        });
        setCurrentCharIdx((prev) => prev + 1);
      }, 35); // typing speed per char (35ms)

      return () => clearTimeout(charTimer);
    } else {
      // Line completed, move to next line after small delay
      const nextLineTimer = setTimeout(() => {
        setCurrentLineIdx((prev) => prev + 1);
        setCurrentCharIdx(0);
      }, 250);
      return () => clearTimeout(nextLineTimer);
    }
  }, [currentLineIdx, currentCharIdx]);

  return (
    <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/80 space-y-2 text-slate-700 shadow-inner font-mono text-xs min-h-[140px] flex flex-col justify-center">
      {displayedLines.map((line, idx) => (
        <div key={idx} className="flex items-center gap-1.5 leading-relaxed">
          {idx === 0 && <Terminal className="w-4 h-4 text-violet-600 flex-shrink-0" />}
          {line.prefix && (
            <span className={line.prefixColor || 'text-slate-500'}>
              {line.prefix}
            </span>
          )}
          <span className={line.className}>
            {line.text}
          </span>
          {/* Terminal Cursor for active typing line */}
          {idx === currentLineIdx && (
            <span className="w-2 h-4 bg-violet-600 inline-block ml-0.5 animate-pulse" />
          )}
        </div>
      ))}

      {/* Show initial cursor if empty */}
      {displayedLines.length === 0 && (
        <div className="flex items-center gap-1.5 leading-relaxed text-violet-600">
          <Terminal className="w-4 h-4 text-violet-600 flex-shrink-0" />
          <span className="text-violet-600 font-bold">$ </span>
          <span className="w-2 h-4 bg-violet-600 inline-block" />
        </div>
      )}
    </div>
  );
}
