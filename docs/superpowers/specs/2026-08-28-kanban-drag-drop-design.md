# CRM/Clientes — Drag-and-drop no kanban

Data: 2026-08-28

## Objetivo

O board kanban da tela CRM/Clientes (`src/pages/ClientesPage.tsx`, view
"kanban") hoje é só leitura — os cards mostram o estágio de cada cliente
mas não podem ser movidos. Este spec cobre tornar o board funcional:
arrastar um card de cliente pra outra coluna muda o estágio dele de
verdade no banco (`crm.deals.estagio`), não só visualmente.

Pedido explícito do usuário (2026-08-28), depois de usar a Fase A ao vivo
pela primeira vez e sentir falta dessa interação. Primeiro item da Fase B
a ser construído, escolhido por ser pequeno e isolado.

## Contexto

- A função `updateDealEstagio(id, estagio)` já existe em
  `src/lib/api/deals.ts` (Task 9 da Fase A) — foi construída antevendo
  esse uso, mas nunca foi chamada por nenhuma tela. Este spec é
  literalmente só sobre ligá-la à interação de arrastar.
- O board já agrupa os cards por estágio via `porEstagio` (um
  `useMemo` sobre `filtradas`, que por sua vez filtra `rows` pela busca).
- Os 4 estágios são fixos: `lead | ativado | em_risco | inativo`
  (`Estagio` em `src/lib/types.ts`).

## Abordagem

**API nativa de drag-and-drop do HTML5** — `draggable`, `onDragStart`,
`onDragOver`, `onDrop` — sem biblioteca nova. Decisão do usuário: prioriza
simplicidade e zero dependência nova sobre um visual mais suave (a
alternativa considerada foi uma biblioteca dedicada tipo `dnd-kit`, mais
polida mas com mais código pra manter — descartada).

- Cada card do kanban (`<Link>` que hoje só navega) ganha
  `draggable={true}` e um `onDragStart` que guarda o `deal.id` sendo
  arrastado em estado local do componente (`useState`) — não usa
  `event.dataTransfer.setData`, porque o drag começa e termina na mesma
  página/componente, então não há necessidade do mecanismo de
  transferência de dados entre origens diferentes que o `dataTransfer`
  resolve.
- Cada coluna (`<div>` de estágio) ganha `onDragOver` (chama
  `preventDefault()`, obrigatório pra permitir o drop) e `onDrop`.
- No `onDrop`: se a coluna de destino for igual à coluna de origem, não
  faz nada (sem chamada à API, sem re-render desnecessário). Se for
  diferente, chama `updateDealEstagio(dealId, novoEstagio)` e, ao
  terminar (sucesso ou falha), recarrega os dados da tela (mesmo padrão
  já usado em `ClientePage.tsx`: chama a API, depois recarrega do banco —
  sem estado otimista, sem lógica de "desfazer").

## Erros

Reaproveita o padrão de erro que a Fase A já tem nas 3 telas (bloco de
erro simples abaixo do "Carregando…", com `try/catch/finally`
resetando `erro` a cada tentativa — ver `ClientesPage.tsx` já corrigido
no whole-branch review da Fase A). Se `updateDealEstagio` falhar, mostra
o mesmo bloco de erro; como a tela recarrega do banco em seguida, o
board volta a refletir o estado real (o cliente continua na coluna
antiga, já que a mudança não foi persistida) — não precisa de rollback
manual no estado local.

## Fora de escopo

- Reordenar cards dentro da mesma coluna (não há campo de ordenação/
  prioridade em `crm.deals` hoje, e nenhuma tela usa isso).
- Registrar automaticamente uma interação/nota ao mudar de estágio via
  drag (pedido futuro plausível, mas não pedido agora — YAGNI).
- Suporte a touch/mobile (drag-and-drop nativo do HTML5 não funciona bem
  em touch; a Fase A inteira já não tem alvo mobile, então não é
  regressão).
- Qualquer mudança nas outras telas ou no schema `crm` — usa só a função
  de API que já existe.

## Testes

Sem lógica pura nova (a decisão de estágio é só "coluna onde foi
solto"), então sem novo teste unitário — a verificação é manual: arrastar
um card de "Leads" pra "Ativados" e confirmar que ele aparece na nova
coluna após recarregar a página (e que o Dashboard, que conta por
`deals.estagio`, reflete a mudança).
