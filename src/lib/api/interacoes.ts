import { crmDb } from "@/lib/supabaseClient";
import type { Canal, Interacao } from "@/lib/types";

export async function listInteracoes(): Promise<Interacao[]> {
  const { data, error } = await crmDb.from("interacoes").select("*").order("data_referencia", { ascending: false });
  if (error) throw error;
  return data as Interacao[];
}

export async function listInteracoesByContact(contactId: string): Promise<Interacao[]> {
  const { data, error } = await crmDb
    .from("interacoes")
    .select("*")
    .eq("contact_id", contactId)
    .order("data_referencia", { ascending: false });
  if (error) throw error;
  return data as Interacao[];
}

export interface NovaInteracao {
  contact_id: string;
  deal_id: string | null;
  autor: string;
  canal: Canal;
  nota: string;
  status: "pendente" | "concluido";
  data_referencia: string;
}

export async function createInteracao(input: NovaInteracao): Promise<void> {
  const { error } = await crmDb.from("interacoes").insert(input);
  if (error) throw error;
}

export async function concludeInteracao(id: string): Promise<void> {
  const { error } = await crmDb
    .from("interacoes")
    .update({ status: "concluido", concluido_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
