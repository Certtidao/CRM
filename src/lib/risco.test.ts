import { describe, it, expect } from "vitest";
import { calcularSinaisRisco } from "./risco";
import type { Contact, AccessLog } from "./types";

const HOJE = new Date("2026-08-28T12:00:00Z");

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    nome: "Teste",
    tipo_pessoa: "J",
    documento: "0",
    email: null,
    telefone: null,
    segmento: null,
    origem: null,
    responsavel_comercial: null,
    plano_atual: "Profissional",
    saldo_atual: 500,
    ultimo_deposito_em: "2026-08-20",
    criado_em: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function log(diasAtras: number, acao = "emitiu certidão de matrícula"): AccessLog {
  const d = new Date(HOJE);
  d.setDate(d.getDate() - diasAtras);
  return { id: `log-${diasAtras}`, contact_id: "c1", contact_user_id: null, ip: "0.0.0.0", data_hora: d.toISOString(), acao };
}

describe("calcularSinaisRisco", () => {
  it("saudavel quando emitiu recentemente, saldo ok e sem queda", () => {
    const logs = [log(2), log(10), log(20), log(35), log(40)];
    const r = calcularSinaisRisco(contact(), logs, HOJE);
    expect(r.semPedido30d).toBe(false);
    expect(r.saldoParado60d).toBe(false);
    expect(r.quedaConsumo50pct).toBe(false);
    expect(r.nivelRisco).toBe("saudavel");
  });

  it("sinaliza sem_pedido_30d quando ultima emissao passou de 30 dias", () => {
    const logs = [log(45)];
    const r = calcularSinaisRisco(contact(), logs, HOJE);
    expect(r.semPedido30d).toBe(true);
  });

  it("sinaliza sem_pedido_30d quando nunca emitiu e cadastro tem mais de 30 dias", () => {
    const r = calcularSinaisRisco(contact({ criado_em: "2026-01-01T00:00:00Z" }), [], HOJE);
    expect(r.semPedido30d).toBe(true);
  });

  it("nao sinaliza sem_pedido_30d pra lead recem-cadastrado sem uso", () => {
    const r = calcularSinaisRisco(contact({ criado_em: "2026-08-25T00:00:00Z" }), [], HOJE);
    expect(r.semPedido30d).toBe(false);
  });

  it("sinaliza saldo_parado_60d quando saldo baixo e sem deposito recente", () => {
    const r = calcularSinaisRisco(contact({ saldo_atual: 10, ultimo_deposito_em: "2026-05-01" }), [], HOJE);
    expect(r.saldoParado60d).toBe(true);
  });

  it("nao sinaliza saldo_parado_60d quando saldo alto mesmo sem deposito recente", () => {
    const r = calcularSinaisRisco(contact({ saldo_atual: 500, ultimo_deposito_em: "2026-05-01" }), [], HOJE);
    expect(r.saldoParado60d).toBe(false);
  });

  it("sinaliza queda_consumo_50pct quando uso caiu mais de 50% no ultimo mes", () => {
    const logs = [log(35), log(40), log(45), log(50), log(10)]; // 4 no periodo anterior, 1 no atual
    const r = calcularSinaisRisco(contact(), logs, HOJE);
    expect(r.quedaConsumo50pct).toBe(true);
  });

  it("nao sinaliza queda_consumo_50pct quando nao havia uso anterior pra comparar", () => {
    const logs = [log(5)];
    const r = calcularSinaisRisco(contact(), logs, HOJE);
    expect(r.quedaConsumo50pct).toBe(false);
  });

  it("nivelRisco soma os 3 sinais", () => {
    const contatoRisco = contact({ saldo_atual: 5, ultimo_deposito_em: "2026-01-01" });
    const logs = [log(35), log(40), log(45)]; // so uso antigo -> sem_pedido_30d true, sem uso recente pra medir queda
    const r = calcularSinaisRisco(contatoRisco, logs, HOJE);
    expect(r.semPedido30d).toBe(true);
    expect(r.saldoParado60d).toBe(true);
    expect(["atencao", "risco"]).toContain(r.nivelRisco);
  });
});
