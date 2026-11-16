"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { formatLong, greeting, today } from "@/lib/utils";
import { CompletionChart, DistributionChart } from "@/components/dashboard/Charts";
import {
  FavoritesQuick,
  ProjectProgress,
  RecentActivity,
  StatCards,
  TodayFocus,
  UpcomingList,
} from "@/components/dashboard/Widgets";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";

export default function DashboardPage() {
  const state = useAppState();
  const { openNewTask } = useStore();
  const me = state.members[state.currentUserId];
  const firstName = me.name.split(" ")[0];
  const mainBoard = state.boardOrder.find((id) => state.boards[id]?.favorite) ?? state.boardOrder[0];

  return (
    <div className="animate-fade-in mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div>
          <p className="text-sm font-semibold text-cyan-200/90 first-letter:uppercase">{formatLong(today())}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {greeting()}, {firstName}
            <span className="text-violet-300">.</span>
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-slate-300">
            <TodayFocus />
          </p>
        </div>
        <div className="flex gap-2">
          {mainBoard && (
            <Link href={`/boards/${mainBoard}`} className="btn-secondary">
              Abrir {state.boards[mainBoard].title} <ArrowRight className="size-4" />
            </Link>
          )}
          <button className="btn-primary" onClick={() => openNewTask({})}>
            <Plus className="size-4" /> Nova tarefa
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <StatCards />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <CompletionChart />
            <DistributionChart />
          </div>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <ProjectProgress />
            <UpcomingList />
          </div>
        </div>
        <aside className="grid content-start gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-1" aria-label="Painel contextual">
          <MiniCalendar />
          <FavoritesQuick />
          <div className="md:col-span-2 xl:col-span-1">
            <RecentActivity />
          </div>
        </aside>
      </div>
    </div>
  );
}
