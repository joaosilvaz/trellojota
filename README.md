# JOTA Boards

O espaço de trabalho do Jota para organizar ideias e executar projetos com estilo.
Quadros Kanban, lista, calendário e dashboard analítico, com visual escuro e translúcido.

## Como rodar

Requisitos: Node.js 18.18 ou mais recente (testado com Node 22).

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Versão de produção:

```bash
npm run build
npm start
```

## O que tem

- **Dashboard**: saudação, tarefas abertas, concluídas, atrasadas e vencendo; gráfico de conclusões (7 ou 14 dias); distribuição por prioridade ou status; progresso dos projetos; calendário compacto; próximos dias; atividade recente; favoritos. Tudo é calculado a partir dos dados reais.
- **Quadro Kanban** (`dnd-kit`): arraste cartões entre colunas e reordene; arraste colunas pela alça. Pelo teclado, use Espaço para pegar/soltar, as setas para mover e Esc para cancelar. É possível criar, renomear, mover, excluir e marcar colunas de conclusão.
- **Cabeçalho do quadro**: título e descrição editáveis, membros, favorito, cor, busca, filtros (responsável, etiqueta, prioridade, arquivadas), ordenação e painel lateral com a visão do projeto.
- **Visualizações**: Quadro, Lista (edição rápida de título, status, prioridade e prazo) e Calendário (tarefas posicionadas pelo prazo).
- **Detalhes da tarefa**: título, descrição, status, prioridade, responsáveis, início e prazo (com validação), etiquetas (é possível criar novas), checklist com progresso, anexos (imagens de demonstração ou upload de até 1,5 MB), comentários e histórico. Ações para duplicar, arquivar/restaurar e excluir (com confirmação).
- **Busca global** (`Ctrl K` ou `/`), notificações, menu do usuário e espaço de trabalho.
- **Atalhos**: `N` cria uma tarefa e `B` cria um quadro.
- **Configurações**: perfil, nome do espaço, animações (sistema ou reduzidas), barra lateral recolhida, exportar/importar backup em JSON, restaurar a demonstração e começar do zero.

## Dados

Tudo fica salvo no `localStorage` do navegador (chave `jota-boards:v1`). Recarregar a página mantém as alterações. Para voltar aos dados iniciais, use **Configurações → Restaurar demonstração**.

## Estrutura

```
src/
  app/                 rotas (App Router): dashboard, quadros, calendário, atividade, configurações
  components/
    layout/            AppShell, Sidebar, Topbar, busca global
    board/             Kanban, cartão, lista, cabeçalho, painel do projeto, criação de quadro
    task/              painel de detalhes e modal de nova tarefa
    dashboard/         métricas, gráficos (Recharts) e widgets
    calendar/          calendário mensal e compacto
    ui/                monograma, avatar, modal, popover, chips, capas geradas
  lib/                 tipos, store com persistência, seletores, dados de demonstração, utilitários
```

Stack: Next.js 15 (App Router) + React 19 + TypeScript, Tailwind CSS 4, dnd-kit, lucide-react e Recharts.
