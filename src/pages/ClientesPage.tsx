import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import { listContacts } from "@/lib/api/contacts";
import { listDeals } from "@/lib/api/deals";
import { listAccessLogs } from "@/lib/api/accessLogs";
import { calcularSinaisRisco } from "@/lib/risco";
import type { AccessLog, Contact, Deal, Estagio, NivelRisco } from "@/lib/types";

const ESTAGIOS: Estagio[] = ["lead", "ativado", "em_risco", "inativo"];
const ESTAGIO_LABELS: Record<Estagio, string> = {
  lead: "Leads",
  ativado: "Ativados",
  em_risco: "Em Risco",
  inativo: "Inativos",
};
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

interface ClienteRow {
  contact: Contact;
  deal: Deal | undefined;
  nivelRisco: NivelRisco;
}

export default function ClientesPage() {
  const [rows, setRows] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [view, setView] = useState<"lista" | "kanban">("kanban");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return rows;
    return rows.filter((r) => r.contact.nome.toLowerCase().includes(termo));
  }, [rows, busca]);

  const porEstagio = useMemo(() => {
    const grupos = Object.fromEntries(ESTAGIOS.map((e) => [e, [] as ClienteRow[]])) as Record<Estagio, ClienteRow[]>;
    for (const row of filtradas) {
      const estagio = row.deal?.estagio ?? "lead";
      grupos[estagio].push(row);
    }
    return grupos;
  }, [filtradas]);

  if (erro) return <div className="text-sm text-destructive">{erro}</div>;

  if (loading) return <div className="text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus clientes e acompanhe todo o funil.</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <button
            onClick={() => setView("lista")}
            className={`rounded p-1.5 ${view === "lista" ? "bg-accent" : ""}`}
            aria-label="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`rounded p-1.5 ${view === "kanban" ? "bg-accent" : ""}`}
            aria-label="Visualização em kanban"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-md border px-3 py-2 text-sm"
      />

      {view === "kanban" ? (
        <div className="grid grid-cols-4 gap-4">
          {ESTAGIOS.map((estagio) => (
            <div key={estagio} className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{ESTAGIO_LABELS[estagio]}</span>
                <span className="text-xs text-muted-foreground">{porEstagio[estagio].length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {porEstagio[estagio].map(({ contact, nivelRisco }) => (
                  <Link
                    key={contact.id}
                    to={`/clientes/${contact.id}`}
                    className="block rounded-md border p-3 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">{contact.nome}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{contact.segmento}</div>
                    <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${RISCO_BADGE[nivelRisco]}`}>
                      {RISCO_LABEL[nivelRisco]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Cliente</th>
                <th className="p-3">Segmento</th>
                <th className="p-3">Estágio</th>
                <th className="p-3">Risco</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(({ contact, deal, nivelRisco }) => (
                <tr key={contact.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="p-3">
                    <Link to={`/clientes/${contact.id}`} className="font-medium hover:underline">
                      {contact.nome}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{contact.segmento}</td>
                  <td className="p-3">{ESTAGIO_LABELS[deal?.estagio ?? "lead"]}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${RISCO_BADGE[nivelRisco]}`}>
                      {RISCO_LABEL[nivelRisco]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
