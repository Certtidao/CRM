import { crmDb } from "@/lib/supabaseClient";
import type { Deal, Estagio } from "@/lib/types";

export async function listDeals(): Promise<Deal[]> {
  const { data, error } = await crmDb.from("deals").select("*").order("atualizado_em", { ascending: false });
  if (error) throw error;
  return data as Deal[];
}

export async function listDealsByContact(contactId: string): Promise<Deal[]> {
  const { data, error } = await crmDb.from("deals").select("*").eq("contact_id", contactId);
  if (error) throw error;
  return data as Deal[];
}

export async function updateDealEstagio(id: string, estagio: Estagio): Promise<void> {
  const { error } = await crmDb
    .from("deals")
    .update({ estagio, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
