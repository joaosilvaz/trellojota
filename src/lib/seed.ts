import type { AppState, Board, Column, Task, Priority, Activity, Notification } from "./types";
import { addDays, today } from "./utils";

export const STATE_VERSION = 1;

function isoAt(daysAgo: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

type TaskInput = {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  priority?: Priority;
  assignees?: string[];
  start?: number; // dias a partir de hoje
  due?: number;
  checklist?: [string, boolean][];
  comments?: [string, string, number][]; // memberId, texto, dias atrás
  cover?: string; // preset de capa
  attachments?: { name: string; cover: string }[];
  createdDaysAgo?: number;
  completedDaysAgo?: number;
};

export function createSeed(): AppState {
  const t0 = today();

  const members: AppState["members"] = {
    m_jota: { id: "m_jota", name: "Jota", initials: "J", role: "Direção criativa", hue: 18, photo: "/jota.jpg" },
  };

  const labels: AppState["labels"] = {
    l_brand: { id: "l_brand", name: "Branding", color: "violet" },
    l_ui: { id: "l_ui", name: "UI/UX", color: "blue" },
    l_motion: { id: "l_motion", name: "Motion", color: "cyan" },
    l_content: { id: "l_content", name: "Conteúdo", color: "amber" },
    l_dev: { id: "l_dev", name: "Dev", color: "green" },
    l_research: { id: "l_research", name: "Pesquisa", color: "pink" },
    l_bug: { id: "l_bug", name: "Bug", color: "red" },
  };

  const boards: AppState["boards"] = {};
  const columns: AppState["columns"] = {};
  const tasks: AppState["tasks"] = {};

  function makeTask(boardId: string, columnId: string, input: TaskInput, isDone: boolean): Task {
    const hash = [...input.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const created = isoAt(input.createdDaysAgo ?? (hash % 11) + 1, 9 + (hash % 8), 15);
    const attachments = [
      ...(input.cover ? [{ name: `capa-${input.id}.png`, cover: input.cover }] : []),
      ...(input.attachments ?? []),
    ].map((a, i) => ({
      id: `${input.id}_att${i}`,
      name: a.name,
      src: `cover:${a.cover}`,
      kind: "image" as const,
      size: `${(1.2 + ((i * 7 + input.id.length) % 9) / 3).toFixed(1)} MB`,
      createdAt: created,
    }));
    const completedAt = isDone ? isoAt(input.completedDaysAgo ?? 1, 16, 30) : undefined;
    const history = [
      { id: `${input.id}_h0`, memberId: input.assignees?.[0] ?? "m_jota", text: "criou esta tarefa", createdAt: created },
    ];
    if (completedAt) {
      history.push({ id: `${input.id}_h1`, memberId: input.assignees?.[0] ?? "m_jota", text: "moveu para Concluído", createdAt: completedAt });
    }
    return {
      id: input.id,
      boardId,
      columnId,
      title: input.title,
      description: input.description ?? "",
      labelIds: input.labels ?? [],
      priority: input.priority ?? "media",
      assigneeIds: input.assignees ?? [],
      startDate: input.start !== undefined ? addDays(t0, input.start) : undefined,
      dueDate: input.due !== undefined ? addDays(t0, input.due) : undefined,
      checklist: (input.checklist ?? []).map(([text, done], i) => ({ id: `${input.id}_c${i}`, text, done })),
      comments: (input.comments ?? []).map(([memberId, text, ago], i) => ({
        id: `${input.id}_cm${i}`,
        memberId,
        text,
        createdAt: isoAt(ago, 11 + i, 20),
      })),
      attachments,
      coverId: input.cover ? attachments[0].id : undefined,
      history,
      createdAt: created,
      completedAt,
      archived: false,
    };
  }

  function makeBoard(
    board: Omit<Board, "columnIds">,
    cols: { id: string; title: string; isDone?: boolean; tasks: TaskInput[] }[],
  ) {
    boards[board.id] = { ...board, columnIds: cols.map((c) => c.id) };
    for (const c of cols) {
      const col: Column = { id: c.id, boardId: board.id, title: c.title, taskIds: [], isDone: c.isDone };
      for (const ti of c.tasks) {
        const task = makeTask(board.id, c.id, ti, !!c.isDone);
        tasks[task.id] = task;
        col.taskIds.push(task.id);
      }
      columns[col.id] = col;
    }
  }

  /* ------------------------------ JOTA Studio ------------------------------ */
  makeBoard(
    {
      id: "b_studio",
      title: "JOTA Studio",
      description: "Rebranding do estúdio, novo site e sistema visual para 2027.",
      accent: "orange",
      memberIds: ["m_jota"],
      favorite: true,
      createdAt: isoAt(40),
    },
    [
      {
        id: "c_ideias",
        title: "Ideias",
        tasks: [
          {
            id: "t_podcast",
            title: "Podcast “Bastidores do Jota”",
            description: "Série curta mostrando o processo criativo por trás de cada projeto do estúdio.",
            labels: ["l_content", "l_research"],
            priority: "baixa",
            assignees: ["m_jota"],
            createdDaysAgo: 3,
            comments: [["m_jota", "Gosto da ideia. Podemos testar com 3 episódios pilotos.", 2]],
          },
          {
            id: "t_3d",
            title: "Explorar monograma J em 3D",
            description: "Estudos de volume, vidro e luz para usar o J em aberturas de vídeo.",
            labels: ["l_brand", "l_motion"],
            priority: "media",
            assignees: ["m_jota"],
            cover: "prism",
            createdDaysAgo: 2,
          },
          {
            id: "t_newsletter",
            title: "Newsletter mensal de referências",
            description: "Curadoria de design, motion e tecnologia enviada para clientes e parceiros.",
            labels: ["l_content"],
            priority: "baixa",
            createdDaysAgo: 5,
          },
        ],
      },
      {
        id: "c_todo",
        title: "A fazer",
        tasks: [
          {
            id: "t_cases",
            title: "Escrever estudos de caso do portfólio",
            description: "Três cases completos com desafio, processo e resultado: Orbit, Nébula e Clara Café.",
            labels: ["l_content"],
            priority: "alta",
            assignees: ["m_jota"],
            due: 2,
            checklist: [
              ["Case App Orbit", false],
              ["Case Nébula Records", false],
              ["Case Clara Café", false],
              ["Revisão de texto", false],
            ],
            comments: [["m_jota", "Já tenho o rascunho do Orbit, envio amanhã.", 1]],
          },
          {
            id: "t_tokens",
            title: "Definir tokens de cor e tipografia",
            description: "Consolidar paleta preta com laranja Claude e neutros, com escalas de contraste AA.",
            labels: ["l_brand", "l_ui"],
            priority: "urgente",
            assignees: ["m_jota"],
            start: -2,
            due: 1,
            checklist: [
              ["Paleta primária", true],
              ["Escala de cinzas", true],
              ["Tokens semânticos", false],
              ["Testes de contraste", false],
            ],
            cover: "grid",
          },
          {
            id: "t_analytics",
            title: "Configurar analytics do novo site",
            description: "Eventos de conversão para contato, newsletter e downloads do media kit.",
            labels: ["l_dev"],
            priority: "media",
            assignees: ["m_jota"],
            due: 6,
          },
          {
            id: "t_fotos",
            title: "Sessão de fotos da equipe",
            description: "Retratos com luz azul e violeta para a página Sobre.",
            labels: ["l_brand"],
            priority: "media",
            assignees: ["m_jota"],
            due: 9,
            cover: "dunes",
          },
        ],
      },
      {
        id: "c_doing",
        title: "Em andamento",
        tasks: [
          {
            id: "t_home",
            title: "Layout da nova home",
            description: "Hero com monograma animado, seção de cases e chamada para contato.",
            labels: ["l_ui", "l_brand"],
            priority: "alta",
            assignees: ["m_jota"],
            start: -5,
            due: 0,
            checklist: [
              ["Wireframe", true],
              ["Hero", true],
              ["Seção de cases", true],
              ["Rodapé", false],
              ["Versão mobile", false],
            ],
            comments: [
              ["m_jota", "O hero ficou forte. Vamos reduzir o brilho do gradiente?", 2],
              ["m_jota", "Ajustado! Subi a v3 no anexo.", 1],
            ],
            cover: "aurora",
            attachments: [{ name: "home-v3-mobile.png", cover: "wave" }],
          },
          {
            id: "t_vinheta",
            title: "Vinheta de abertura 6s",
            description: "Animação do J se formando a partir de pontos de luz, com trilha curta.",
            labels: ["l_motion"],
            priority: "alta",
            assignees: ["m_jota"],
            start: -3,
            due: 3,
            checklist: [
              ["Storyboard", true],
              ["Animação base", true],
              ["Sound design", false],
            ],
            cover: "orbit",
          },
          {
            id: "t_cms",
            title: "Integrar CMS ao site",
            description: "Modelos de conteúdo para cases, artigos e equipe.",
            labels: ["l_dev"],
            priority: "media",
            assignees: ["m_jota"],
            start: -4,
            due: -1,
            checklist: [
              ["Modelagem", true],
              ["Rotas dinâmicas", false],
              ["Preview de rascunhos", false],
            ],
            comments: [["m_jota", "Travado esperando os modelos de case. Libero hoje.", 0]],
          },
        ],
      },
      {
        id: "c_review",
        title: "Em revisão",
        tasks: [
          {
            id: "t_manual",
            title: "Manual de marca v2",
            description: "Usos do monograma, áreas de respiro, aplicações em vídeo e redes.",
            labels: ["l_brand"],
            priority: "alta",
            assignees: ["m_jota"],
            due: 4,
            checklist: [
              ["Monograma", true],
              ["Cores", true],
              ["Tipografia", true],
              ["Aplicações", true],
              ["Exportar PDF", false],
            ],
            cover: "prism",
            comments: [["m_jota", "Revisei as páginas 1 a 12, só ajustes pequenos.", 1]],
          },
          {
            id: "t_bug_menu",
            title: "Menu mobile sobrepõe o logo",
            description: "Em telas abaixo de 360px o menu cobre o monograma.",
            labels: ["l_bug", "l_dev"],
            priority: "urgente",
            assignees: ["m_jota"],
            due: -2,
          },
        ],
      },
      {
        id: "c_done",
        title: "Concluído",
        isDone: true,
        tasks: [
          { id: "t_brief", title: "Briefing do rebranding", labels: ["l_brand"], priority: "alta", assignees: ["m_jota"], due: -12, completedDaysAgo: 12, createdDaysAgo: 20 },
          { id: "t_bench", title: "Benchmark de estúdios criativos", labels: ["l_research"], priority: "media", assignees: ["m_jota"], due: -10, completedDaysAgo: 10, createdDaysAgo: 18 },
          { id: "t_mood", title: "Moodboard visual", labels: ["l_brand"], priority: "media", assignees: ["m_jota"], due: -8, completedDaysAgo: 8, cover: "aurora", createdDaysAgo: 16 },
          { id: "t_naming", title: "Validar nome e domínio", labels: ["l_research"], priority: "alta", assignees: ["m_jota"], due: -7, completedDaysAgo: 7, createdDaysAgo: 15 },
          { id: "t_logo", title: "Desenho final do monograma J", labels: ["l_brand"], priority: "urgente", assignees: ["m_jota"], due: -4, completedDaysAgo: 4, createdDaysAgo: 14 },
          { id: "t_repo", title: "Setup do repositório do site", labels: ["l_dev"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 3, createdDaysAgo: 9 },
          { id: "t_sitemap", title: "Arquitetura de informação do site", labels: ["l_ui"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 1, createdDaysAgo: 8 },
        ],
      },
    ],
  );

  /* ------------------------------ App Orbit ------------------------------ */
  makeBoard(
    {
      id: "b_orbit",
      title: "Lançamento App Orbit",
      description: "App de foco e rotina para criadores. Lançamento previsto para dezembro.",
      accent: "cyan",
      memberIds: ["m_jota"],
      favorite: true,
      createdAt: isoAt(30),
    },
    [
      {
        id: "c_o_backlog",
        title: "Backlog",
        tasks: [
          { id: "t_o_widget", title: "Widget de foco para tela inicial", labels: ["l_ui", "l_dev"], priority: "baixa", assignees: ["m_jota"] },
          { id: "t_o_onboarding", title: "Pesquisa de onboarding com 8 usuários", labels: ["l_research"], priority: "media", assignees: ["m_jota"], due: 8 },
        ],
      },
      {
        id: "c_o_design",
        title: "Design",
        tasks: [
          {
            id: "t_o_paywall",
            title: "Tela de assinatura",
            description: "Planos mensal e anual com teste grátis de 7 dias.",
            labels: ["l_ui"],
            priority: "alta",
            assignees: ["m_jota"],
            due: 2,
            cover: "wave",
            checklist: [["Layout", true], ["Estados de erro", false]],
          },
        ],
      },
      {
        id: "c_o_dev",
        title: "Desenvolvimento",
        tasks: [
          { id: "t_o_sync", title: "Sincronização offline", labels: ["l_dev"], priority: "urgente", assignees: ["m_jota"], due: 5, start: -3, checklist: [["Fila local", true], ["Resolução de conflitos", false], ["Testes", false]] },
          { id: "t_o_push", title: "Notificações de pausa", labels: ["l_dev"], priority: "media", assignees: ["m_jota"], due: 11 },
        ],
      },
      {
        id: "c_o_qa",
        title: "QA",
        tasks: [
          { id: "t_o_crash", title: "Crash ao girar a tela no timer", labels: ["l_bug"], priority: "alta", assignees: ["m_jota"], due: -1 },
        ],
      },
      {
        id: "c_o_done",
        title: "Publicado",
        isDone: true,
        tasks: [
          { id: "t_o_timer", title: "Timer Pomodoro personalizável", labels: ["l_dev"], priority: "alta", assignees: ["m_jota"], completedDaysAgo: 9, createdDaysAgo: 25 },
          { id: "t_o_icons", title: "Ícone do app e splash", labels: ["l_brand"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 4, cover: "orbit", createdDaysAgo: 20 },
          { id: "t_o_stats", title: "Tela de estatísticas semanais", labels: ["l_ui", "l_dev"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 4, createdDaysAgo: 14 },
          { id: "t_o_store", title: "Textos da App Store", labels: ["l_content"], priority: "baixa", assignees: ["m_jota"], completedDaysAgo: 1, createdDaysAgo: 7 },
        ],
      },
    ],
  );

  /* ---------------------------- Canal Jota ---------------------------- */
  makeBoard(
    {
      id: "b_canal",
      title: "Canal Jota — Conteúdo",
      description: "Calendário editorial de vídeos, reels e carrosséis do canal.",
      accent: "pink",
      memberIds: ["m_jota"],
      favorite: false,
      createdAt: isoAt(25),
    },
    [
      {
        id: "c_k_pauta",
        title: "Pauta",
        tasks: [
          { id: "t_k_ia", title: "Vídeo: IA no processo criativo", labels: ["l_content", "l_research"], priority: "media", assignees: ["m_jota"], due: 10 },
          { id: "t_k_setup", title: "Reel: meu setup de trabalho", labels: ["l_content"], priority: "baixa", assignees: ["m_jota"], due: 7 },
        ],
      },
      {
        id: "c_k_roteiro",
        title: "Roteiro",
        tasks: [
          { id: "t_k_carrossel", title: "Carrossel: 5 erros de portfólio", labels: ["l_content"], priority: "alta", assignees: ["m_jota"], due: 1, checklist: [["Roteiro", true], ["Revisão", false], ["Design dos slides", false]] },
        ],
      },
      {
        id: "c_k_gravacao",
        title: "Gravação",
        tasks: [
          { id: "t_k_tour", title: "Tour pelo novo estúdio", labels: ["l_content", "l_motion"], priority: "media", assignees: ["m_jota"], due: 4, cover: "dunes" },
        ],
      },
      {
        id: "c_k_edicao",
        title: "Edição",
        tasks: [
          { id: "t_k_vlog", title: "Vlog: bastidores do rebranding", labels: ["l_motion"], priority: "alta", assignees: ["m_jota"], due: 3, start: -1 },
        ],
      },
      {
        id: "c_k_done",
        title: "Publicado",
        isDone: true,
        tasks: [
          { id: "t_k_intro", title: "Vídeo de apresentação do canal", labels: ["l_content"], priority: "alta", assignees: ["m_jota"], completedDaysAgo: 8, createdDaysAgo: 22 },
          { id: "t_k_reel1", title: "Reel: processo do monograma", labels: ["l_motion"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 4, createdDaysAgo: 12 },
          { id: "t_k_reel2", title: "Reel: paleta da nova marca", labels: ["l_brand"], priority: "media", assignees: ["m_jota"], completedDaysAgo: 1, createdDaysAgo: 9 },
          { id: "t_k_live", title: "Live de perguntas e respostas", labels: ["l_content"], priority: "baixa", assignees: ["m_jota"], completedDaysAgo: 0, createdDaysAgo: 5 },
        ],
      },
    ],
  );

  /* ------------------------- Instagram @joaosilva.tech ------------------------- */
  makeBoard(
    {
      id: "b_instagram",
      title: "Instagram — @joaosilva.tech",
      description: "Conteúdo do perfil @joaosilva.tech: reels, carrosséis e ajustes do dia a dia.",
      accent: "amber",
      memberIds: ["m_jota"],
      favorite: true,
      createdAt: isoAt(0),
    },
    [
      {
        id: "c_i_front",
        title: "Ajustes front",
        tasks: [
          {
            id: "t_i_contraste",
            title: "Modo dark com mais contraste entre fundo e cards",
            description: "No modo dark, o preto do fundo e o preto dos cards estão muito próximos. Aumentar o contraste para os cards se destacarem do fundo.",
            labels: ["l_ui", "l_dev"],
            priority: "alta",
            assignees: ["m_jota"],
            createdDaysAgo: 0,
          },
        ],
      },
      { id: "c_i_ideias", title: "Ideias", tasks: [] },
      { id: "c_i_roteiro", title: "Roteiro", tasks: [] },
      { id: "c_i_gravacao", title: "Gravação", tasks: [] },
      { id: "c_i_edicao", title: "Edição", tasks: [] },
      { id: "c_i_done", title: "Publicado", isDone: true, tasks: [] },
    ],
  );

  const activity: Activity[] = [
    { id: "a1", memberId: "m_jota", text: "comentou em “Integrar CMS ao site”", boardId: "b_studio", taskId: "t_cms", createdAt: isoAt(0, 9, 40) },
    { id: "a2", memberId: "m_jota", text: "concluiu “Live de perguntas e respostas”", boardId: "b_canal", taskId: "t_k_live", createdAt: isoAt(0, 8, 10) },
    { id: "a3", memberId: "m_jota", text: "anexou home-v3-mobile.png em “Layout da nova home”", boardId: "b_studio", taskId: "t_home", createdAt: isoAt(1, 18, 5) },
    { id: "a4", memberId: "m_jota", text: "comentou em “Manual de marca v2”", boardId: "b_studio", taskId: "t_manual", createdAt: isoAt(1, 15, 30) },
    { id: "a5", memberId: "m_jota", text: "concluiu “Arquitetura de informação do site”", boardId: "b_studio", taskId: "t_sitemap", createdAt: isoAt(1, 14, 0) },
    { id: "a6", memberId: "m_jota", text: "publicou “Textos da App Store”", boardId: "b_orbit", taskId: "t_o_store", createdAt: isoAt(2, 11, 0) },
    { id: "a7", memberId: "m_jota", text: "moveu “Vinheta de abertura 6s” para Em andamento", boardId: "b_studio", taskId: "t_vinheta", createdAt: isoAt(3, 10, 0) },
  ];

  const notifications: Notification[] = [
    { id: "n1", text: "Lembrete: “Integrar CMS ao site” está atrasada", taskId: "t_cms", boardId: "b_studio", read: false, createdAt: isoAt(0, 9, 40) },
    { id: "n2", text: "“Layout da nova home” vence hoje", taskId: "t_home", boardId: "b_studio", read: false, createdAt: isoAt(0, 8, 0) },
    { id: "n3", text: "“Manual de marca v2” foi movido para Em revisão", taskId: "t_manual", boardId: "b_studio", read: true, createdAt: isoAt(2, 16, 0) },
  ];

  return {
    version: STATE_VERSION,
    currentUserId: "m_jota",
    workspaceName: "Jota Studio",
    members,
    labels,
    boards,
    boardOrder: ["b_instagram", "b_studio", "b_orbit", "b_canal"],
    columns,
    tasks,
    activity,
    notifications,
    settings: { reducedMotion: "system", sidebarCollapsed: false, theme: "dark", instagramBoardAdded: true },
  };
}
