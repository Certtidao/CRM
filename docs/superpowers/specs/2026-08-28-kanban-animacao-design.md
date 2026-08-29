# CRM/Clientes — Animação no kanban

Data: 2026-08-28

## Objetivo

O drag-and-drop do board kanban (`src/pages/ClientesPage.tsx`, já
funcional) hoje não dá nenhum retorno visual: nada indica sobre qual
coluna o card está passando durante o arrasto, e quando o card muda de
coluna (após o recarregamento de dados que segue um drop bem-sucedido)
ele simplesmente troca de lugar sem transição. Pedido do usuário
(2026-08-28), depois de usar o drag-and-drop pela primeira vez.

Escopo: duas animações, decididas com o usuário.

1. **Feedback durante o arrasto** — a coluna sob o cursor se destaca
   visualmente; o card sendo arrastado fica com aparência de "levantado".
2. **Transição suave ao soltar** — quando um card muda de coluna, ele
   desaparece suavemente de onde estava e aparece suavemente onde caiu,
   em vez de trocar de lugar de repente.

**Expectativa alinhada com o usuário:** a transição (2) não é o card se
movendo fisicamente de uma coluna até a outra (isso exigiria uma
biblioteca de animação compartilhada entre containers, tipo Framer Motion
com `layoutId` — pesada e fora do critério de "biblioteca pequena"). É
um fade/colapso suave de saída na coluna de origem e um fade/expansão
suave de entrada na coluna de destino — o efeito padrão de bibliotecas
leves de auto-animação de listas, que já resolve a sensação de "troca
abrupta" sem o custo de uma biblioteca de animação compartilhada
completa.

## Abordagem

### Feedback durante o arrasto — CSS/estado React, sem dependência nova

- Novo estado `dragOverEstagio: Estagio | null`.
- `onDragOverColuna` (já existe, hoje só chama `preventDefault()`) passa
  a também marcar `setDragOverEstagio(estagio)`.
- Cada coluna ganha um `onDragLeave` que limpa `dragOverEstagio` quando o
  cursor realmente sai da coluna (não de um filho pra outro dentro dela
  — usa `event.currentTarget.contains(event.relatedTarget as Node)` pra
  distinguir os dois casos, evitando o "piscar" clássico de
  `dragleave`/`dragenter` entre elementos filhos).
- `onDropColuna` e o `onDragEnd` do card (já existe) limpam
  `dragOverEstagio` também, garantindo que nenhum destaque fique "preso".
- Coluna com `dragOverEstagio === estagio` ganha uma classe de destaque
  (borda/anel colorido, ex: `ring-2 ring-primary`).
- Card com `contact's deal.id === draggingDealId` ganha sombra mais forte
  e opacidade reduzida (ex: `shadow-lg opacity-60`), reforçando que ele
  está "no ar".

### Transição suave — `@formkit/auto-animate`

- Nova dependência: `@formkit/auto-animate` (pacote focado só nisso,
  ~2kb minificado+gzip, sem configuração — um hook, sem API pra
  aprender).
- Como o hook (`useAutoAnimate`) precisa de uma ref por container
  animado, e o board tem 4 containers (um por coluna), a lista de cards
  de cada coluna (hoje um `<div className="flex flex-col gap-2">` dentro
  do `.map(ESTAGIOS...)`) é extraída pra um componente `KanbanColuna`
  — cada instância chama `useAutoAnimate()` uma vez, o que respeita as
  regras de hooks do React (não dá pra chamar hook dentro de um loop
  `.map` diretamente).
- `KanbanColuna` recebe como props: `estagio`, `rows` (os
  `ClienteRow` daquela coluna), `draggingDealId`, `dragOverEstagio`, e os
  handlers de drag (`onDragStartCard`, `onDragOverColuna`,
  `onDropColuna`, `onDragLeaveColuna`, `onDragEndCard`) — sem lógica
  própria de estado, só recebe e repassa (a lógica de estado continua
  toda em `ClientesPage`).

## Fora de escopo

- Reordenar cards dentro da mesma coluna com animação (a função de
  reordenar em si já era fora de escopo do drag-and-drop original).
- Qualquer animação na visão de lista (`view === "lista"`) — só o
  kanban foi pedido.
- Animação de "voo" físico entre colunas (ver "Expectativa alinhada"
  acima).

## Testes

Sem lógica pura nova — verificação manual: arrastar um card e observar
(a) a coluna sob o cursor destacada durante o arrasto, (b) o card
arrastado com sombra/opacidade reduzida, (c) ao soltar em coluna
diferente, o card sumindo suavemente da coluna antiga e aparecendo
suavemente na nova (não uma troca instantânea).
