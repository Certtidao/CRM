import type { Deal, Estagio, Interacao } from "./types";

export interface MetricasDashboard {
  negociosPorEstagio: Record<Estagio, number>;
  taxaConversaoUsoContratacao: number;
  tarefasAtrasadas: number;
}

const ESTAGIOS: Estagio[] = ["lead", "ativado", "em_risco", "inativo"];

export function calcularMetricasDashboard(deals: Deal[], interacoes: Interacao[], hoje: Date): MetricasDashboard {
  const negociosPorEstagio = Object.fromEntries(ESTAGIOS.map((e) => [e, 0])) as Record<Estagio, number>;
  for (const d of deals) negociosPorEstagio[d.estagio]++;

  const usaram = deals.filter((d) => d.usou_sistema);
  const taxaConversaoUsoContratacao =
    usaram.length === 0 ? 0 : (usaram.filter((d) => d.contratou).length / usaram.length) * 100;

  const tarefasAtrasadas = interacoes.filter(
    (i) => i.status === "pendente" && new Date(i.data_referencia) < hoje,
  ).length;

  return { negociosPorEstagio, taxaConversaoUsoContratacao, tarefasAtrasadas };
}
