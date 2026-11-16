"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Monograma J do JOTA Boards: gancho do J + ponto de luz (foco) */
export function Monogram({ className, size = 36 }: { className?: string; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const bg = `jg-bg-${uid}`;
  const stroke = `jg-stroke-${uid}`;
  const dot = `jg-dot-${uid}`;
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
        <linearGradient id={bg} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c1c1c" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={stroke} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e58a68" />
          <stop offset="1" stopColor="#d97757" />
        </linearGradient>
        <radialGradient id={dot} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f5c6b2" />
          <stop offset="1" stopColor="#d97757" />
        </radialGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="12" fill={`url(#${bg})`} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="12" fill="none" stroke="rgba(217,119,87,0.35)" />
      <path d="M2 14 C 10 6, 26 4, 38 10" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
      <path
        d="M24 11 V 23.5 a 7 7 0 0 1 -7 7 h -0.5 a 6 6 0 0 1 -5.5 -3.6"
        stroke={`url(#${stroke})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29.5" cy="9.5" r="3" fill={`url(#${dot})`} />
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
          <p className="mt-1 text-[11px] font-semibold tracking-[0.3em] text-brand-200/80">BOARDS</p>
        </div>
      )}
    </div>
  );
}
