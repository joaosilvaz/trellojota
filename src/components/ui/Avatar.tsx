import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
};

export function Avatar({
  member,
  size = "sm",
  className,
  title = true,
}: {
  member?: Member;
  size?: keyof typeof sizes;
  className?: string;
  title?: boolean;
}) {
  if (!member) return null;
  return (
    <span
      title={title ? member.name : undefined}
      aria-label={member.name}
      role="img"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-[#0d0d2b]",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${member.hue} 85% 66%), hsl(${member.hue + 35} 70% 42%))`,
      }}
    >
      {member.initials}
    </span>
  );
}

export function AvatarStack({
  members,
  max = 4,
  size = "sm",
}: {
  members: (Member | undefined)[];
  max?: number;
  size?: keyof typeof sizes;
}) {
  const list = members.filter(Boolean) as Member[];
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={size} />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-white/10 font-bold text-slate-200 ring-2 ring-[#0d0d2b]",
            sizes[size],
          )}
          aria-label={`mais ${extra} membros`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
