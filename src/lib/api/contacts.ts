import { crmDb } from "@/lib/supabaseClient";
import type { Contact, ContactUser } from "@/lib/types";

export async function listContacts(): Promise<Contact[]> {
  const { data, error } = await crmDb.from("contacts").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data as Contact[];
}

export async function getContact(id: string): Promise<Contact> {
  const { data, error } = await crmDb.from("contacts").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Contact;
}

export async function listContactUsers(contactId: string): Promise<ContactUser[]> {
  const { data, error } = await crmDb.from("contact_users").select("*").eq("contact_id", contactId);
  if (error) throw error;
  return data as ContactUser[];
}
