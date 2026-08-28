import { useEffect, useState } from "react";
import { listDeals } from "@/lib/api/deals";
import { listInteracoes } from "@/lib/api/interacoes";
import { calcularMetricasDashboard, type MetricasDashboard } from "@/lib/metrics";

const ESTAGIO_LABELS: Record<string, string> = {
  lead: "Leads",
  ativado: "Ativados",
  em_risco: "Em risco",
  inativo: "Inativos",
};

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [deals, interacoes] = await Promise.all([listDeals(), listInteracoes()]);
      setMetricas(calcularMetricasDashboard(deals, interacoes, new Date()));
      setLoading(false);
    })();
  }, []);

  if (loading || !metricas) {
    return <div className="text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral do relacionamento com clientes.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(metricas.negociosPorEstagio).map(([estagio, count]) => (
          <div key={estagio} className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">{ESTAGIO_LABELS[estagio]}</div>
            <div className="mt-1 text-2xl font-semibold">{count}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Taxa de conversão uso → contratação</div>
          <div className="mt-1 text-2xl font-semibold">
            {metricas.taxaConversaoUsoContratacao.toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Tarefas atrasadas</div>
          <div className="mt-1 text-2xl font-semibold">{metricas.tarefasAtrasadas}</div>
        </div>
      </div>
    </div>
  );
}
