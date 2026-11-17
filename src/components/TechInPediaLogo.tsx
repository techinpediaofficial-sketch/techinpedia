'use client';

export default function TechInPediaLogo({
  className = 'h-6 sm:h-7 w-auto',
  variant = 'dark',
  showTagline = false,
}: {
  className?: string;
  variant?: 'dark' | 'light';
  showTagline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="TechInPedia Logo"
        className="h-6 sm:h-7 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(128,46,227,0.25)]"
      />
    </div>
  );
}
