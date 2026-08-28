import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getContact } from "@/lib/api/contacts";
import { listDealsByContact } from "@/lib/api/deals";
import { listInteracoesByContact, createInteracao, concludeInteracao } from "@/lib/api/interacoes";
import { listAccessLogsByContact } from "@/lib/api/accessLogs";
import { calcularSinaisRisco, type SinaisRisco } from "@/lib/risco";
import type { AccessLog, Contact, Deal, Interacao } from "@/lib/types";

type Aba = "resumo" | "emissoes" | "financeiro" | "marketing" | "timeline";
const ABAS: { id: Aba; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "emissoes", label: "Emissões" },
  { id: "financeiro", label: "Financeiro" },
  { id: "marketing", label: "Marketing/Origem" },
  { id: "timeline", label: "Timeline" },
];

export default function ClientePage() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [risco, setRisco] = useState<SinaisRisco | null>(null);
  const [aba, setAba] = useState<Aba>("resumo");
  const [novaNota, setNovaNota] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregar() {
    if (!id) return;
    const [c, d, i, a] = await Promise.all([
      getContact(id),
      listDealsByContact(id),
      listInteracoesByContact(id),
      listAccessLogsByContact(id),
    ]);
    setContact(c);
    setDeals(d);
    setInteracoes(i);
    setAccessLogs(a);
    setRisco(calcularSinaisRisco(c, a, new Date()));
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function registrarInteracao() {
    if (!id || !novaNota.trim()) return;
    await createInteracao({
      contact_id: id,
      deal_id: deals[0]?.id ?? null,
      autor: "Você",
      canal: "outro",
      nota: novaNota.trim(),
      status: "concluido",
      data_referencia: new Date().toISOString().slice(0, 10),
    });
    setNovaNota("");
    await carregar();
  }

  async function concluir(interacaoId: string) {
    await concludeInteracao(interacaoId);
    await carregar();
  }

  if (loading || !contact || !risco) return <div className="text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{contact.nome}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {contact.segmento} · Cliente desde {new Date(contact.criado_em).toLocaleDateString("pt-BR")}
      </p>

      <div className="mt-4 flex gap-2 border-b">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`border-b-2 px-3 py-2 text-sm ${
              aba === a.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {aba === "resumo" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Nível de risco</div>
              <div className="mt-1 text-lg font-semibold capitalize">{risco.nivelRisco}</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>Sem pedido 30d: {risco.semPedido30d ? "sim" : "não"}</li>
                <li>Saldo parado 60d: {risco.saldoParado60d ? "sim" : "não"}</li>
                <li>Queda de consumo: {risco.quedaConsumo50pct ? "sim" : "não"}</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Responsável comercial</div>
              <div className="mt-1 text-lg font-semibold">{contact.responsavel_comercial ?? "—"}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Negócios</div>
              <div className="mt-1 text-lg font-semibold">{deals.length}</div>
            </div>
          </div>
        )}

        {aba === "emissoes" && (
          <div className="rounded-lg border bg-card p-4">
            {accessLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro de uso.</p>
            ) : (
              <ul className="divide-y">
                {accessLogs.map((log) => (
                  <li key={log.id} className="py-2 text-sm">
                    <span className="text-muted-foreground">{new Date(log.data_hora).toLocaleDateString("pt-BR")}</span>{" "}
                    — {log.acao}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {aba === "financeiro" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Plano atual</div>
              <div className="mt-1 text-lg font-semibold">{contact.plano_atual ?? "Sem plano"}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Saldo atual</div>
              <div className="mt-1 text-lg font-semibold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contact.saldo_atual)}
              </div>
            </div>
          </div>
        )}

        {aba === "marketing" && (
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">Origem</div>
            <div className="mt-1 text-lg font-semibold capitalize">{contact.origem ?? "—"}</div>
          </div>
        )}

        {aba === "timeline" && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Registrar uma interação…"
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <button
                onClick={registrarInteracao}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Registrar
              </button>
            </div>
            {interacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
            ) : (
              <ul className="space-y-2">
                {interacoes.map((i) => (
                  <li key={i.id} className="rounded-lg border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {i.status === "pendente" ? "Tarefa" : "Interação"} · {i.canal}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(i.data_referencia).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{i.nota}</p>
                    {i.status === "pendente" && (
                      <button
                        onClick={() => concluir(i.id)}
                        className="mt-2 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Marcar como concluída
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
