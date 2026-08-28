import { describe, it, expect } from "vitest";
import { calcularMetricasDashboard } from "./metrics";
import type { Deal, Interacao } from "./types";

const HOJE = new Date("2026-08-28T12:00:00Z");

function deal(overrides: Partial<Deal>): Deal {
  return {
    id: "d1", contact_id: "c1", titulo: "t", estagio: "lead", valor_estimado: 0,
    usou_sistema: false, o_que_usou: null, contratou: false, plano_contratado: null,
    criado_em: HOJE.toISOString(), atualizado_em: HOJE.toISOString(), ...overrides,
  };
}

function interacao(overrides: Partial<Interacao>): Interacao {
  return {
    id: "i1", contact_id: "c1", deal_id: null, autor: "x", canal: "whatsapp", nota: "n",
    status: "pendente", data_referencia: HOJE.toISOString().slice(0, 10), concluido_em: null,
    criado_em: HOJE.toISOString(), ...overrides,
  };
}

describe("calcularMetricasDashboard", () => {
  it("conta negocios por estagio", () => {
    const deals = [deal({ estagio: "lead" }), deal({ estagio: "lead" }), deal({ estagio: "ativado" })];
    const m = calcularMetricasDashboard(deals, [], HOJE);
    expect(m.negociosPorEstagio.lead).toBe(2);
    expect(m.negociosPorEstagio.ativado).toBe(1);
    expect(m.negociosPorEstagio.em_risco).toBe(0);
    expect(m.negociosPorEstagio.inativo).toBe(0);
  });

  it("calcula taxa de conversao uso -> contratacao", () => {
    const deals = [
      deal({ usou_sistema: true, contratou: true }),
      deal({ usou_sistema: true, contratou: false }),
      deal({ usou_sistema: false, contratou: false }),
    ];
    const m = calcularMetricasDashboard(deals, [], HOJE);
    expect(m.taxaConversaoUsoContratacao).toBeCloseTo(50);
  });

  it("taxa de conversao e 0 quando ninguem usou o sistema", () => {
    const m = calcularMetricasDashboard([deal({ usou_sistema: false })], [], HOJE);
    expect(m.taxaConversaoUsoContratacao).toBe(0);
  });

  it("conta tarefas atrasadas (pendentes com data_referencia no passado)", () => {
    const interacoes = [
      interacao({ status: "pendente", data_referencia: "2026-08-20" }),
      interacao({ status: "pendente", data_referencia: "2026-09-01" }),
      interacao({ status: "concluido", data_referencia: "2026-08-10" }),
    ];
    const m = calcularMetricasDashboard([], interacoes, HOJE);
    expect(m.tarefasAtrasadas).toBe(1);
  });

  it("nao conta como atrasada uma tarefa pendente com data_referencia igual a hoje", () => {
    const interacoes = [interacao({ status: "pendente", data_referencia: "2026-08-28" })];
    const m = calcularMetricasDashboard([], interacoes, HOJE);
    expect(m.tarefasAtrasadas).toBe(0);
  });
});
