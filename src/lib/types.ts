export type Estagio = "lead" | "ativado" | "em_risco" | "inativo";
export type Canal = "whatsapp" | "ligacao" | "email" | "reuniao" | "outro";
export type StatusInteracao = "pendente" | "concluido";
export type NivelRisco = "saudavel" | "atencao" | "risco";

export interface Contact {
  id: string;
  nome: string;
  tipo_pessoa: "F" | "J";
  documento: string;
  email: string | null;
  telefone: string | null;
  segmento: string | null;
  origem: string | null;
  responsavel_comercial: string | null;
  plano_atual: string | null;
  saldo_atual: number;
  ultimo_deposito_em: string | null;
  criado_em: string;
}

export interface ContactUser {
  id: string;
  contact_id: string;
  nome: string;
  email: string | null;
  papel: string | null;
}

export interface Deal {
  id: string;
  contact_id: string;
  titulo: string;
  estagio: Estagio;
  valor_estimado: number;
  usou_sistema: boolean;
  o_que_usou: string | null;
  contratou: boolean;
  plano_contratado: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Interacao {
  id: string;
  contact_id: string;
  deal_id: string | null;
  autor: string;
  canal: Canal;
  nota: string;
  status: StatusInteracao;
  data_referencia: string;
  concluido_em: string | null;
  criado_em: string;
}

export interface AccessLog {
  id: string;
  contact_id: string;
  contact_user_id: string | null;
  ip: string;
  data_hora: string;
  acao: string;
}
