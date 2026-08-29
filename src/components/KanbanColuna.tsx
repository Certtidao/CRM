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
