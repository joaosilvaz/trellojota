"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppState } from "@/lib/store";
import { completedSeries, priorityDistribution, statusDistribution } from "@/lib/selectors";
import { cn, formatShort, formatWeekday, priorityName, priorityStyle } from "@/lib/utils";
import type { Priority } from "@/lib/types";
import { useReducedMotion } from "@/lib/useReducedMotion";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      {label && <p className="mb-1 font-semibold text-white">{formatWeekday(label)}, {formatShort(label)}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-200">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function CompletionChart() {
  const state = useAppState();
  const reduced = useReducedMotion();
  const [range, setRange] = useState<7 | 14>(14);
  const data = useMemo(() => completedSeries(state, range), [state, range]);
  const total = data.reduce((s, d) => s + d.concluidas, 0);
  const created = data.reduce((s, d) => s + d.criadas, 0);

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white">Tarefas concluídas</h2>
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-display text-2xl font-semibold text-white">{total}</span> nos últimos {range} dias ·{" "}
            {created} criadas
          </p>
        </div>
        <div role="group" aria-label="Período" className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {[7, 14].map((r) => (
            <button
              key={r}
              aria-pressed={range === r}
              onClick={() => setRange(r as 7 | 14)}
              className={cn("h-8 rounded-lg px-3 text-xs font-semibold transition", range === r ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
            >
              {r} dias
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-56" role="img" aria-label={`Gráfico: ${total} tarefas concluídas e ${created} criadas nos últimos ${range} dias`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c6bff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#7c6bff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => (range === 7 ? formatWeekday(d) : d.slice(8, 10))}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={range === 7 ? 0 : 1}
            />
            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
            <Area type="monotone" dataKey="criadas" name="Criadas" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#gCreated)" isAnimationActive={!reduced} />
            <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke="#8b7bff" strokeWidth={2.5} fill="url(#gDone)" activeDot={{ r: 5, fill: "#c4b5fd", stroke: "#1e1b4b" }} isAnimationActive={!reduced} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-5 text-xs text-slate-300">
        <span className="flex items-center gap-2"><span className="h-1 w-4 rounded-full bg-[#8b7bff]" />Concluídas</span>
        <span className="flex items-center gap-2"><span className="h-1 w-4 rounded-full border-t border-dashed border-cyan-300" />Criadas</span>
      </div>
    </div>
  );
}

const STATUS_COLORS = ["#6f8dff", "#a78bfa", "#22d3ee", "#34d399"];

export function DistributionChart() {
  const state = useAppState();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<"priority" | "status">("priority");

  const data = useMemo(() => {
    if (mode === "priority") {
      const d = priorityDistribution(state);
      return (Object.keys(d) as Priority[]).map((k) => ({ name: priorityName[k], value: d[k], color: priorityStyle[k].hex }));
    }
    const s = statusDistribution(state);
    return Object.entries(s).map(([name, value], i) => ({ name, value, color: STATUS_COLORS[i] }));
  }, [state, mode]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass flex h-full flex-col rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[15px] font-semibold text-white">Distribuição</h2>
        <div role="group" aria-label="Agrupar por" className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {(
            [
              ["priority", "Prioridade"],
              ["status", "Status"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              aria-pressed={mode === k}
              onClick={() => setMode(k)}
              className={cn("h-7 rounded-lg px-2.5 text-xs font-semibold transition", mode === k ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">{mode === "priority" ? "Tarefas em aberto" : "Todas as tarefas ativas"}</p>
      <div className="relative mx-auto mt-2 h-44 w-44" role="img" aria-label={data.map((d) => `${d.name}: ${d.value}`).join(", ")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? data : [{ name: "vazio", value: 1, color: "rgba(255,255,255,0.08)" }]} dataKey="value" innerRadius={56} outerRadius={78} paddingAngle={total ? 3 : 0} stroke="none" isAnimationActive={!reduced}>
              {(total ? data : [{ color: "rgba(255,255,255,0.08)" }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl font-semibold text-white">{total}</p>
            <p className="text-xs text-slate-400">tarefas</p>
          </div>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
            <span className="truncate text-slate-300">{d.name}</span>
            <span className="ml-auto font-semibold text-white">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
