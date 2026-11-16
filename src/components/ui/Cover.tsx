/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** Capas geradas (sem imagens externas) para prévias de cartões e anexos de demonstração */
export const COVER_PRESETS: Record<string, { name: string; style: React.CSSProperties; svg?: React.ReactNode }> = {
  aurora: {
    name: "Aurora",
    style: {
      background:
        "radial-gradient(120% 90% at 10% 0%, #d97757 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, #7a3a25 0%, transparent 60%), linear-gradient(135deg, #1a1a1a, #070707)",
    },
    svg: <path d="M0 70 C 60 30, 120 90, 200 40 L200 120 L0 120 Z" fill="rgba(255,255,255,0.06)" />,
  },
  grid: {
    name: "Grade",
    style: {
      background:
        "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px) 0 0/16px 16px, linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0/16px 16px, linear-gradient(135deg, #c15f3c, #4d2417)",
    },
    svg: (
      <>
        <rect x="24" y="22" width="56" height="56" rx="10" fill="rgba(255,255,255,0.2)" />
        <rect x="92" y="22" width="84" height="24" rx="8" fill="rgba(255,255,255,0.12)" />
        <rect x="92" y="54" width="60" height="24" rx="8" fill="rgba(10,10,10,0.55)" />
      </>
    ),
  },
  orbit: {
    name: "Órbita",
    style: { background: "radial-gradient(circle at 50% 55%, #2a1a14 0%, #080808 70%)" },
    svg: (
      <>
        <ellipse cx="100" cy="60" rx="70" ry="24" fill="none" stroke="rgba(238,164,134,0.45)" />
        <ellipse cx="100" cy="60" rx="44" ry="44" fill="none" stroke="rgba(255,255,255,0.18)" />
        <circle cx="100" cy="60" r="16" fill="#d97757" />
        <circle cx="166" cy="52" r="5" fill="#f5c6b2" />
      </>
    ),
  },
  prism: {
    name: "Prisma",
    style: { background: "linear-gradient(160deg, #0c0c0c 0%, #241a16 50%, #0a0a0a 100%)" },
    svg: (
      <>
        <polygon points="100,14 150,100 50,100" fill="rgba(217,119,87,0.6)" />
        <polygon points="100,14 150,100 118,100" fill="rgba(245,198,178,0.35)" />
        <line x1="0" y1="62" x2="78" y2="58" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      </>
    ),
  },
  dunes: {
    name: "Dunas",
    style: { background: "linear-gradient(180deg, #1a1a1a 0%, #9e4c30 55%, #d97757 100%)" },
    svg: (
      <>
        <circle cx="150" cy="38" r="16" fill="rgba(253,230,210,0.85)" />
        <path d="M0 90 C 50 60, 90 100, 140 78 S 200 70, 200 70 L200 120 L0 120Z" fill="rgba(8,8,8,0.8)" />
      </>
    ),
  },
  wave: {
    name: "Onda",
    style: { background: "linear-gradient(135deg, #c15f3c 0%, #3a1d12 60%, #0a0a0a 100%)" },
    svg: (
      <>
        <path d="M0 60 Q 25 40 50 60 T 100 60 T 150 60 T 200 60" stroke="rgba(255,255,255,0.5)" strokeWidth="3" fill="none" />
        <path d="M0 78 Q 25 58 50 78 T 100 78 T 150 78 T 200 78" stroke="rgba(245,198,178,0.35)" strokeWidth="2" fill="none" />
      </>
    ),
  },
};

export function Cover({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  if (src.startsWith("cover:")) {
    const preset = COVER_PRESETS[src.slice(6)] ?? COVER_PRESETS.aurora;
    return (
      <div className={cn("relative overflow-hidden", className)} style={preset.style} role="img" aria-label={alt || preset.name}>
        {preset.svg && (
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
            {preset.svg}
          </svg>
        )}
      </div>
    );
  }
  return <img src={src} alt={alt} className={cn("object-cover", className)} />;
}
