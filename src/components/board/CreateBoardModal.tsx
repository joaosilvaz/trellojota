"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { BoardAccent } from "@/lib/types";
import { BOARD_ACCENTS, accentStyle, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

const TEMPLATES: { id: string; name: string; columns: string[] }[] = [
  { id: "jota", name: "Fluxo JOTA", columns: ["Ideias", "A fazer", "Em andamento", "Em revisão", "Concluído"] },
  { id: "simples", name: "Simples", columns: ["A fazer", "Fazendo", "Feito"] },
  { id: "conteudo", name: "Conteúdo", columns: ["Pauta", "Roteiro", "Produção", "Edição", "Publicado"] },
];

export function CreateBoardModal() {
  const { createBoardOpen, setCreateBoardOpen, actions } = useStore();
  const toast = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState<BoardAccent>("orange");
  const [template, setTemplate] = useState("jota");
  const [error, setError] = useState("");

  useEffect(() => {
    if (createBoardOpen) {
      setTitle("");
      setDescription("");
      setAccent("orange");
      setTemplate("jota");
      setError("");
    }
  }, [createBoardOpen]);

  const close = () => setCreateBoardOpen(false);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = title.trim();
    if (t.length < 2) {
      setError("Dê um nome com pelo menos 2 caracteres.");
      return;
    }
    if (t.length > 60) {
      setError("Use no máximo 60 caracteres.");
      return;
    }
    const id = actions.createBoard({
      title: t,
      description: description.trim(),
      accent,
      columns: TEMPLATES.find((x) => x.id === template)?.columns,
    });
    close();
    toast.success("Quadro criado", `“${t}” está pronto para receber tarefas.`);
    router.push(`/boards/${id}`);
  };

  return (
    <Modal
      open={createBoardOpen}
      onClose={close}
      title="Novo quadro"
      description="Organize um projeto, cliente ou rotina em colunas."
      footer={
        <>
          <button className="btn-secondary" onClick={close}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={() => submit()}>
            Criar quadro
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="board-title" className="mb-1.5 block text-sm font-semibold text-neutral-200">
            Nome do quadro
          </label>
          <input
            id="board-title"
            data-autofocus
            className={cn("field", error && "border-rose-400/60")}
            placeholder="Ex.: Identidade visual Clara Café"
            value={title}
            maxLength={80}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "board-title-error" : undefined}
          />
          {error && (
            <p id="board-title-error" className="mt-1.5 text-[13px] text-rose-300">
              {error}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="board-desc" className="mb-1.5 block text-sm font-semibold text-neutral-200">
            Descrição <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <textarea
            id="board-desc"
            className="field min-h-20 resize-none"
            placeholder="Qual é o objetivo deste quadro?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-neutral-200">Cor de destaque</legend>
          <div className="flex flex-wrap gap-2">
            {BOARD_ACCENTS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAccent(a)}
                aria-pressed={accent === a}
                aria-label={`Cor ${a}`}
                className={cn("grid size-10 place-items-center rounded-xl ring-2 transition", accent === a ? "ring-white" : "ring-transparent hover:ring-white/30")}
                style={{ background: `linear-gradient(135deg, ${accentStyle[a].from}, ${accentStyle[a].to})` }}
              >
                {accent === a && <Check className="size-4 text-white" />}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-neutral-200">Modelo de colunas</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {TEMPLATES.map((tp) => (
              <button
                type="button"
                key={tp.id}
                onClick={() => setTemplate(tp.id)}
                aria-pressed={template === tp.id}
                className={cn(
                  "rounded-2xl border p-3 text-left transition",
                  template === tp.id ? "border-brand-400/70 bg-brand-500/15" : "border-white/10 bg-white/[0.03] hover:border-white/20",
                )}
              >
                <p className="text-sm font-semibold text-white">{tp.name}</p>
                <p className="mt-1 text-xs leading-snug text-neutral-400">{tp.columns.join(" · ")}</p>
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
