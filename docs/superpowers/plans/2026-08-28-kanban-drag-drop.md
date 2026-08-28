# Kanban Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CRM/Clientes kanban board (`src/pages/ClientesPage.tsx`) functional — dragging a client's card into a different column updates that client's `deal.estagio` in the real `crm` schema, not just on screen.

**Architecture:** Native HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) on the existing card/column JSX — no new dependency. The existing (but previously unused) `updateDealEstagio(id, estagio)` API function gets its first caller. The page's inline data-loading effect is extracted into a named `carregar()` function (matching the pattern already established in `ClientePage.tsx`) so it can be re-invoked after a successful or failed drag.

**Tech Stack:** Same as the rest of the CRM app — React, TypeScript, Tailwind, no new libraries.

## Global Constraints

- No new npm dependency — plain HTML5 drag-and-drop only (spec: "Abordagem").
- Dropping a card on the column it's already in is a no-op — no API call (spec: "Abordagem").
- No optimistic UI update and no manual rollback logic — on drop, call the API, then reload real data from the backend, success or failure (spec: "Abordagem", "Erros").
- No card reordering within a column, no automatic interaction logging on stage change, no touch/mobile support (spec: "Fora de escopo").
- Reuses the existing error-display pattern (`erro` state + `try/catch/finally`) already present in the file.

---

## File Structure

Single file, fully self-contained:
- **Modify:** `src/pages/ClientesPage.tsx` — extract `carregar()`, add drag state, add `onDragStart`/`onDragOver`/`onDrop` handlers, wire them into the existing kanban JSX.

No new files.

---

### Task 1: Drag-and-drop on the kanban board

**Files:**
- Modify: `src/pages/ClientesPage.tsx` (whole file affected; current content is 182 lines)

**Interfaces:**
- Consumes: `updateDealEstagio(id: string, estagio: Estagio): Promise<void>` — already exported from `src/lib/api/deals.ts`, never previously called anywhere. `Deal.id` and `Deal.estagio` from `src/lib/types.ts`.
- Produces: nothing new consumed elsewhere — this is the last unbuilt piece of the Fase A kanban, a leaf change.

- [ ] **Step 1: Import `updateDealEstagio` and the `DragEvent` type**

Change the existing deals import line (currently `import { listDeals } from "@/lib/api/deals";`) to:

```tsx
import { listDeals, updateDealEstagio } from "@/lib/api/deals";
```

Change the existing React import line (currently `import { useEffect, useMemo, useState } from "react";`) to also bring in the `DragEvent` type (needed by Step 4):

```tsx
import { useEffect, useMemo, useState, type DragEvent } from "react";
```

- [ ] **Step 2: Extract the data-loading effect into a named `carregar()` function**

Replace the current `useEffect` block (the one starting `useEffect(() => { (async () => {` and its matching `}, []);`) with:

```tsx
async function carregar() {
  setErro(null);
  try {
    const [contacts, deals, accessLogs] = await Promise.all([listContacts(), listDeals(), listAccessLogs()]);
    const logsByContact = new Map<string, AccessLog[]>();
    for (const log of accessLogs) {
      const list = logsByContact.get(log.contact_id) ?? [];
      list.push(log);
      logsByContact.set(log.contact_id, list);
    }
    const dealByContact = new Map(deals.map((d) => [d.contact_id, d]));
    const hoje = new Date();
    setRows(
      contacts.map((contact) => ({
        contact,
        deal: dealByContact.get(contact.id),
        nivelRisco: calcularSinaisRisco(contact, logsByContact.get(contact.id) ?? [], hoje).nivelRisco,
      })),
    );
  } catch (e) {
    console.error(e);
    setErro("Não foi possível carregar os dados. Tente novamente.");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

This is a pure refactor at this point (same logic, now callable by name) plus one behavioral fix folded in: `setErro(null)` at the top, so a later re-invocation of `carregar()` (Step 4) doesn't leave a stale error message on screen after a successful reload — the same fix already applied to `ClientePage.tsx` in the Fase A final review.

- [ ] **Step 3: Add drag state**

Inside the component, alongside the existing `useState` calls (after the `busca` state), add:

```tsx
const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
const [atualizandoEstagio, setAtualizandoEstagio] = useState(false);
```

- [ ] **Step 4: Add the drag/drop handler functions**

Add these functions in the component body, after `porEstagio`'s `useMemo` and before the `if (erro)` early return:

```tsx
function onDragStartCard(dealId: string) {
  setDraggingDealId(dealId);
}

function onDragOverColuna(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
}

async function onDropColuna(estagioDestino: Estagio) {
  const dealId = draggingDealId;
  setDraggingDealId(null);
  if (!dealId) return;

  const rowAtual = rows.find((r) => r.deal?.id === dealId);
  if (!rowAtual?.deal || rowAtual.deal.estagio === estagioDestino) return;

  setAtualizandoEstagio(true);
  try {
    await updateDealEstagio(dealId, estagioDestino);
  } catch (e) {
    console.error(e);
    setErro("Não foi possível mover o cliente. Tente novamente.");
  } finally {
    setAtualizandoEstagio(false);
    await carregar();
  }
}
```

Note: `carregar()` runs in `finally` regardless of success or failure — on success it picks up the new `estagio`; on failure it reloads the real (unchanged) `estagio`, so the board always ends up showing the true database state, with `erro` set if the update itself failed.

- [ ] **Step 5: Wire the handlers into the kanban JSX**

In the kanban column `<div>` (the one mapping over `ESTAGIOS`, currently `<div key={estagio} className="rounded-lg border bg-card p-3">`), add the drop-zone handlers:

```tsx
<div
  key={estagio}
  className="rounded-lg border bg-card p-3"
  onDragOver={onDragOverColuna}
  onDrop={() => onDropColuna(estagio)}
>
```

In the card-rendering map (currently `{porEstagio[estagio].map(({ contact, nivelRisco }) => (`), destructure `deal` too and make the card draggable:

```tsx
{porEstagio[estagio].map(({ contact, deal, nivelRisco }) => (
  <Link
    key={contact.id}
    to={`/clientes/${contact.id}`}
    draggable={!!deal && !atualizandoEstagio}
    onDragStart={() => deal && onDragStartCard(deal.id)}
    className={`block rounded-md border p-3 text-sm hover:bg-accent ${
      deal ? "cursor-grab active:cursor-grabbing" : ""
    }`}
  >
```

(Everything else inside the `<Link>` — the name, segment, badge — stays exactly as it is today.)

- [ ] **Step 6: Verify the build**

```bash
npm run build
```

Expected: succeeds with no TypeScript errors.

- [ ] **Step 7: Manual verification**

This feature has no pure logic to unit-test (the spec's own "Testes" section calls for manual verification only — the decision is just "which column was it dropped on"). Since the `crm` schema is now exposed and login works end-to-end (confirmed live 2026-08-28), verify against the real running app:

1. `npm run dev`, log in, go to `/clientes`, confirm the kanban view loads with cards in their existing columns.
2. Drag a card from one column to a different column (e.g. "Leads" → "Ativados"). Confirm: the card visually moves to the new column after the drop (via the `carregar()` reload).
3. Reload the page (`F5`). Confirm the card is still in the new column — the change persisted to the database, not just local state.
4. Go to `/` (Dashboard). Confirm the stage-count cards reflect the move (the column you dragged from has one fewer, the column you dragged to has one more) — this exercises the fact that the Dashboard counts the same `crm.deals.estagio` field this feature writes to.
5. Drag a card and drop it back in the *same* column it started in. Confirm no visible flicker/reload happens beyond what a normal click would do, and check the browser's network tab (or just trust the code: `rowAtual.deal.estagio === estagioDestino` short-circuits) — no `updateDealEstagio` call should fire.
6. **Click** (without dragging) a card. Confirm it still navigates to `/clientes/:id` normally — dragging must not have broken the existing click-to-open-profile behavior.
7. Move the card you changed in step 2 back to its original column, so the seed data returns to its documented distribution (lead=2, ativado=5, em_risco=3, inativo=2) for anyone else verifying against the Fase A plan's numbers later.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ClientesPage.tsx
git commit -m "feat: add drag-and-drop stage changes to CRM/Clientes kanban"
```
