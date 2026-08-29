# Kanban Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag feedback (destination column highlight, lifted-card shadow) and a smooth per-column enter/exit transition when a card changes stage, to the already-functional CRM/Clientes kanban board.

**Architecture:** Drag feedback is pure CSS/React state (no dependency). The smooth transition uses `@formkit/auto-animate`, which requires one `useAutoAnimate()` hook call per animated list — since the board has 4 column lists rendered from a `.map()`, the column's card list is extracted into a new `KanbanColuna` component (hooks can't be called inside a loop directly).

**Tech Stack:** React, TypeScript, Tailwind (existing) + `@formkit/auto-animate` (new, ~2kb, zero-config).

## Global Constraints

- The transition is a per-column enter/exit fade/collapse, NOT a card physically flying between two different DOM containers — that would require a heavier shared-layout-animation library, explicitly out of scope (spec: "Expectativa alinhada com o usuário").
- No animation on the list view (`view === "lista"`) — kanban only (spec: "Fora de escopo").
- No reordering-within-column animation — that capability doesn't exist yet regardless (spec: "Fora de escopo").
- `RISCO_BADGE`/`RISCO_LABEL` — small (5-line) constant lookup tables — are duplicated into the new `KanbanColuna.tsx` rather than exported/re-imported from `ClientesPage.tsx`, to keep the new component self-contained and avoid a component-importing-from-the-page-that-renders-it layering. `ClientesPage.tsx` keeps its own copies for the list view.

---

## File Structure

- **Create:** `src/components/KanbanColuna.tsx` — renders one kanban column: header, count, drop-zone handlers, and the `useAutoAnimate`-wrapped card list. Receives all state and handlers as props; owns no state of its own except the `useAutoAnimate` ref.
- **Modify:** `src/pages/ClientesPage.tsx` — adds `dragOverEstagio` state, extends the drag handlers to also manage it, and replaces the inline kanban column JSX with `<KanbanColuna>`.

---

### Task 1: Drag feedback + smooth column transition

**Files:**
- Create: `src/components/KanbanColuna.tsx`
- Modify: `src/pages/ClientesPage.tsx` (current content is 231 lines, shown below where each edit applies)

**Interfaces:**
- Consumes: `Estagio`, `NivelRisco`, `Contact`, `Deal` from `src/lib/types.ts`; `useAutoAnimate` from `@formkit/auto-animate/react`.
- Produces: `KanbanColuna` — a presentational component with the props interface defined in Step 2, consumed only by `ClientesPage.tsx` in this plan.

- [ ] **Step 1: Install the dependency**

```bash
npm install @formkit/auto-animate
```

- [ ] **Step 2: Create `KanbanColuna.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { DragEvent } from "react";
import type { Contact, Deal, Estagio, NivelRisco } from "@/lib/types";

export interface ClienteRow {
  contact: Contact;
  deal: Deal | undefined;
  nivelRisco: NivelRisco;
}

const RISCO_BADGE: Record<NivelRisco, string> = {
  saudavel: "bg-green-100 text-green-800",
  atencao: "bg-amber-100 text-amber-800",
  risco: "bg-red-100 text-red-800",
};
const RISCO_LABEL: Record<NivelRisco, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  risco: "Risco",
};

interface KanbanColunaProps {
  estagio: Estagio;
  label: string;
  rows: ClienteRow[];
  draggingDealId: string | null;
  dragOverEstagio: Estagio | null;
  atualizandoEstagio: boolean;
  onDragStartCard: (dealId: string) => void;
  onDragEndCard: () => void;
  onDragOverColuna: (event: DragEvent<HTMLDivElement>, estagio: Estagio) => void;
  onDragLeaveColuna: (event: DragEvent<HTMLDivElement>) => void;
  onDropColuna: (estagio: Estagio) => void;
}

export function KanbanColuna({
  estagio,
  label,
  rows,
  draggingDealId,
  dragOverEstagio,
  atualizandoEstagio,
  onDragStartCard,
  onDragEndCard,
  onDragOverColuna,
  onDragLeaveColuna,
  onDropColuna,
}: KanbanColunaProps) {
  const [parent] = useAutoAnimate<HTMLDivElement>();

  return (
    <div
      className={`rounded-lg border bg-card p-3 transition-colors ${
        dragOverEstagio === estagio ? "ring-2 ring-primary" : ""
      }`}
      onDragOver={(e) => onDragOverColuna(e, estagio)}
      onDragLeave={onDragLeaveColuna}
      onDrop={(e) => {
        e.preventDefault();
        onDropColuna(estagio);
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      <div ref={parent} className="flex flex-col gap-2">
        {rows.map(({ contact, deal, nivelRisco }) => (
          <Link
            key={contact.id}
            to={`/clientes/${contact.id}`}
            draggable={!!deal && !atualizandoEstagio}
            onDragStart={() => deal && onDragStartCard(deal.id)}
            onDragEnd={onDragEndCard}
            className={`block rounded-md border p-3 text-sm hover:bg-accent ${
              deal ? "cursor-grab active:cursor-grabbing" : ""
            } ${deal?.id === draggingDealId ? "opacity-60 shadow-lg" : ""}`}
          >
            <div className="font-medium">{contact.nome}</div>
            <div className="mt-1 text-xs text-muted-foreground">{contact.segmento}</div>
            <span
              className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${RISCO_BADGE[nivelRisco]}`}
            >
              {RISCO_LABEL[nivelRisco]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `dragOverEstagio` state to `ClientesPage.tsx`**

Alongside the existing `draggingDealId`/`atualizandoEstagio` state (currently the line `const [atualizandoEstagio, setAtualizandoEstagio] = useState(false);`), add:

```tsx
const [dragOverEstagio, setDragOverEstagio] = useState<Estagio | null>(null);
```

- [ ] **Step 4: Update the drag handler functions in `ClientesPage.tsx`**

Replace the current `onDragOverColuna` function:

```tsx
function onDragOverColuna(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
}
```

with:

```tsx
function onDragOverColuna(event: DragEvent<HTMLDivElement>, estagio: Estagio) {
  event.preventDefault();
  setDragOverEstagio(estagio);
}

function onDragLeaveColuna(event: DragEvent<HTMLDivElement>) {
  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
    setDragOverEstagio(null);
  }
}

function onDragEndCard() {
  setDraggingDealId(null);
  setDragOverEstagio(null);
}
```

In `onDropColuna`, add `setDragOverEstagio(null);` right after the existing `setDraggingDealId(null);` line (still inside the function, before the `if (!dealId) return;` check):

```tsx
async function onDropColuna(estagioDestino: Estagio) {
  const dealId = draggingDealId;
  setDraggingDealId(null);
  setDragOverEstagio(null);
  if (!dealId) return;
  // ...rest of the function is unchanged
```

- [ ] **Step 5: Replace the inline kanban column JSX with `<KanbanColuna>`**

Add the import at the top of `ClientesPage.tsx`:

```tsx
import { KanbanColuna } from "@/components/KanbanColuna";
```

Replace the entire kanban `<div className="grid grid-cols-4 gap-4">...</div>` block (the one that maps over `ESTAGIOS` and renders a column `<div>` with cards inside) with:

```tsx
<div className="grid grid-cols-4 gap-4">
  {ESTAGIOS.map((estagio) => (
    <KanbanColuna
      key={estagio}
      estagio={estagio}
      label={ESTAGIO_LABELS[estagio]}
      rows={porEstagio[estagio]}
      draggingDealId={draggingDealId}
      dragOverEstagio={dragOverEstagio}
      atualizandoEstagio={atualizandoEstagio}
      onDragStartCard={onDragStartCard}
      onDragEndCard={onDragEndCard}
      onDragOverColuna={onDragOverColuna}
      onDragLeaveColuna={onDragLeaveColuna}
      onDropColuna={onDropColuna}
    />
  ))}
</div>
```

The list view (`view === "lista"`, the `<table>` block) is untouched — it still uses `ClientesPage.tsx`'s own `RISCO_BADGE`/`RISCO_LABEL` constants directly, which remain in that file exactly as they are today.

- [ ] **Step 6: Verify the build**

```bash
npm run build
```

Expected: succeeds with no TypeScript errors.

- [ ] **Step 7: Manual verification**

No pure logic to unit-test here (spec's own "Testes" section calls for manual verification only). Verify against the real running app:

1. `npm run dev`, log in, go to `/clientes`, kanban view.
2. Start dragging a card. Confirm: the card being dragged shows reduced opacity + a stronger shadow.
3. While still dragging, move the cursor over a different column. Confirm that column shows a highlighted ring/border. Move to another column — confirm the highlight follows (only one column highlighted at a time).
4. Move the cursor off all columns entirely (e.g. over the search box) while still dragging. Confirm no column stays highlighted.
5. Drop the card on a different column. Confirm: the card fades/collapses out of the old column and fades/expands into the new column — not an instant jump — and the highlight ring clears.
6. Repeat the existing drag-and-drop verification from the prior plan (persists on reload, Dashboard reflects the count, same-column drop is a no-op, click still navigates) to confirm nothing regressed.
7. Move the card back to its original column afterward, so the seed data's documented distribution (lead=2, ativado=5, em_risco=3, inativo=2) is restored.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/components/KanbanColuna.tsx src/pages/ClientesPage.tsx
git commit -m "feat: add drag feedback and smooth column transitions to kanban"
```
