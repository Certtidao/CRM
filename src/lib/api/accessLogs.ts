import { crmDb } from "@/lib/supabaseClient";
import type { AccessLog } from "@/lib/types";

export async function listAccessLogs(): Promise<AccessLog[]> {
  const { data, error } = await crmDb.from("access_logs").select("*").order("data_hora", { ascending: false });
  if (error) throw error;
  return data as AccessLog[];
}

export async function listAccessLogsByContact(contactId: string): Promise<AccessLog[]> {
  const { data, error } = await crmDb
    .from("access_logs")
    .select("*")
    .eq("contact_id", contactId)
    .order("data_hora", { ascending: false });
  if (error) throw error;
  return data as AccessLog[];
}
