import type { AccessLog, Contact, NivelRisco } from "./types";

export interface SinaisRisco {
  semPedido30d: boolean;
  saldoParado60d: boolean;
  quedaConsumo50pct: boolean;
  nivelRisco: NivelRisco;
}

const EMISSAO_PREFIXO = "emitiu";
const SALDO_BAIXO_LIMITE = 50;
const DIA_MS = 24 * 60 * 60 * 1000;

function diasEntre(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / DIA_MS);
}

function isEmissao(acao: string): boolean {
  return acao.toLowerCase().startsWith(EMISSAO_PREFIXO);
}

export function calcularSinaisRisco(contact: Contact, accessLogs: AccessLog[], hoje: Date): SinaisRisco {
  const emissoes = accessLogs.filter((l) => isEmissao(l.acao)).map((l) => new Date(l.data_hora));

  const ultimaEmissao = emissoes.length > 0 ? new Date(Math.max(...emissoes.map((d) => d.getTime()))) : null;
  const semPedido30d = ultimaEmissao
    ? diasEntre(hoje, ultimaEmissao) > 30
    : diasEntre(hoje, new Date(contact.criado_em)) > 30;

  const diasDesdeDeposito = contact.ultimo_deposito_em
    ? diasEntre(hoje, new Date(contact.ultimo_deposito_em))
    : diasEntre(hoje, new Date(contact.criado_em));
  const saldoParado60d = contact.saldo_atual < SALDO_BAIXO_LIMITE && diasDesdeDeposito > 60;

  const emissoesUltimos30d = emissoes.filter((d) => diasEntre(hoje, d) <= 30).length;
  const emissoes31a60d = emissoes.filter((d) => diasEntre(hoje, d) > 30 && diasEntre(hoje, d) <= 60).length;
  const quedaConsumo50pct = emissoes31a60d > 0 && emissoesUltimos30d < emissoes31a60d * 0.5;

  const totalSinais = [semPedido30d, saldoParado60d, quedaConsumo50pct].filter(Boolean).length;
  const nivelRisco: NivelRisco = totalSinais === 0 ? "saudavel" : totalSinais === 1 ? "atencao" : "risco";

  return { semPedido30d, saldoParado60d, quedaConsumo50pct, nivelRisco };
}
