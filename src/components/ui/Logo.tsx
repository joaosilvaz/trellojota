import { cn } from "@/lib/utils";

/** Monograma J do JOTA Boards: gancho do J + ponto de luz (foco) */
export function Monogram({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Monograma JOTA"
    >
      <defs>
        <linearGradient id="jg-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b6cff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="jg-stroke" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c7d2fe" />
        </linearGradient>
        <radialGradient id="jg-dot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset="1" stopColor="#22d3ee" />
        </radialGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="12" fill="url(#jg-bg)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="12" fill="none" stroke="rgba(255,255,255,0.28)" />
      <path d="M2 14 C 10 6, 26 4, 38 10" stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />
      <path
        d="M24 11 V 23.5 a 7 7 0 0 1 -7 7 h -0.5 a 6 6 0 0 1 -5.5 -3.6"
        stroke="url(#jg-stroke)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29.5" cy="9.5" r="3" fill="url(#jg-dot)" />
    </svg>
  );
}

export function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Monogram />
      {!collapsed && (
        <div className="leading-none">
          <p className="font-display text-[17px] font-bold tracking-[0.18em] text-white">JOTA</p>
          <p className="mt-1 text-[11px] font-semibold tracking-[0.3em] text-cyan-200/80">BOARDS</p>
        </div>
      )}
    </div>
  );
}
