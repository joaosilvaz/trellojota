"use client";

import { useRef, useState } from "react";
import { Download, Eraser, RotateCcw, Upload } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { STATE_VERSION } from "@/lib/seed";
import type { AppState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Monogram } from "@/components/ui/Logo";

export default function SettingsPage() {
  const state = useAppState();
  const { actions } = useStore();
  const toast = useToast();
  const me = state.members[state.currentUserId];
  const [name, setName] = useState(me.name);
  const [role, setRole] = useState(me.role);
  const [workspace, setWorkspace] = useState(state.workspaceName);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Informe um nome com pelo menos 2 caracteres.";
    if (workspace.trim().length < 2) errs.workspace = "Informe um nome para o espaço de trabalho.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    actions.updateProfile({ name: name.trim(), role: role.trim(), workspaceName: workspace.trim() });
    toast.success("Configurações salvas");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jota-boards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  };

  const importData = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as AppState;
        if (data.version !== STATE_VERSION || !data.boards || !data.tasks || !data.columns) throw new Error("formato");
        actions.importState(data);
        toast.success("Backup importado", "Seus quadros foram restaurados.");
      } catch {
        toast.error("Arquivo inválido", "Selecione um backup exportado pelo JOTA Boards.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Configurações</h1>
        <p className="mt-1 text-[15px] text-neutral-300">Perfil, preferências e dados do seu espaço.</p>
      </header>

      <div className="space-y-5">
        <form onSubmit={saveProfile} className="glass rounded-3xl p-5 sm:p-6" noValidate>
          <h2 className="font-display mb-5 text-[15px] font-semibold text-white">Perfil e espaço de trabalho</h2>
          <div className="mb-5 flex items-center gap-4">
            <Avatar member={{ ...me, name, initials: me.initials }} size="lg" />
            <div>
              <p className="font-semibold text-white">{name || "Seu nome"}</p>
              <p className="text-sm text-neutral-400">{role || "Sua função"}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-name" className="mb-1.5 block text-sm font-semibold text-neutral-200">
                Nome
              </label>
              <input id="s-name" className={cn("field", errors.name && "border-rose-400/60")} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              {errors.name && <p className="mt-1.5 text-[13px] text-rose-300">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="s-role" className="mb-1.5 block text-sm font-semibold text-neutral-200">
                Função
              </label>
              <input id="s-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} maxLength={40} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-ws" className="mb-1.5 block text-sm font-semibold text-neutral-200">
                Nome do espaço de trabalho
              </label>
              <input id="s-ws" className={cn("field", errors.workspace && "border-rose-400/60")} value={workspace} onChange={(e) => setWorkspace(e.target.value)} maxLength={40} />
              {errors.workspace && <p className="mt-1.5 text-[13px] text-rose-300">{errors.workspace}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" className="btn-primary">
              Salvar alterações
            </button>
          </div>
        </form>

        <section className="glass rounded-3xl p-5 sm:p-6">
          <h2 className="font-display mb-4 text-[15px] font-semibold text-white">Preferências</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.03] p-4">
              <div>
                <p className="text-sm font-semibold text-white">Tema</p>
                <p className="text-[13px] text-neutral-400">Alterne entre preto e branco.</p>
              </div>
              <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
                {([["dark", "Preto"], ["light", "Branco"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={state.settings.theme === k}
                    onClick={() => actions.updateSettings({ theme: k })}
                    className={cn("h-8 rounded-lg px-3 text-[13px] font-semibold transition", state.settings.theme === k ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.03] p-4">
              <div>
                <p className="text-sm font-semibold text-white">Animações</p>
                <p className="text-[13px] text-neutral-400">“Sistema” segue a configuração de movimento reduzido do seu dispositivo.</p>
              </div>
              <div role="radiogroup" aria-label="Animações" className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
                {(
                  [
                    ["system", "Sistema"],
                    ["reduce", "Reduzidas"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={state.settings.reducedMotion === k}
                    onClick={() => actions.updateSettings({ reducedMotion: k })}
                    className={cn(
                      "h-8 rounded-lg px-3 text-[13px] font-semibold transition",
                      state.settings.reducedMotion === k ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.03] p-4">
              <span>
                <span className="block text-sm font-semibold text-white">Barra lateral recolhida</span>
                <span className="block text-[13px] text-neutral-400">Mostra apenas os ícones no desktop.</span>
              </span>
              <input
                type="checkbox"
                className="size-5 accent-brand-600"
                checked={state.settings.sidebarCollapsed}
                onChange={(e) => actions.updateSettings({ sidebarCollapsed: e.target.checked })}
              />
            </label>
          </div>
        </section>

        <section className="glass rounded-3xl p-5 sm:p-6">
          <h2 className="font-display mb-1 text-[15px] font-semibold text-white">Dados</h2>
          <p className="mb-4 text-[13px] text-neutral-400">Tudo é salvo automaticamente neste navegador (armazenamento local).</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportData}>
              <Download className="size-4" /> Exportar backup
            </button>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Importar backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                importData(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button className="btn-secondary" onClick={() => setConfirm("reset")}>
              <RotateCcw className="size-4" /> Restaurar demonstração
            </button>
            <button className="btn-danger" onClick={() => setConfirm("clear")}>
              <Eraser className="size-4" /> Começar do zero
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3 px-2 py-4 text-sm text-neutral-400">
          <Monogram size={28} />
          JOTA Boards · feito para organizar ideias e executar projetos com estilo.
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Restaurar demonstração?"
        description="Seus dados atuais serão substituídos pelos quadros de exemplo do JOTA Studio."
        confirmLabel="Restaurar"
        onConfirm={() => {
          actions.resetDemo();
          toast.success("Demonstração restaurada");
        }}
      />
      <ConfirmDialog
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        title="Começar do zero?"
        description="Todos os quadros, tarefas e atividades serão apagados permanentemente. Membros e etiquetas são mantidos. Exporte um backup antes, se quiser."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          actions.importState({
            ...state,
            boards: {},
            boardOrder: [],
            columns: {},
            tasks: {},
            activity: [],
            notifications: [],
          });
          toast.success("Espaço limpo", "Crie seu primeiro quadro quando quiser.");
        }}
      />
    </div>
  );
}
