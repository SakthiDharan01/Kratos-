import { supabase } from "./supabase";
import { Event } from "./store";

export async function fetchEvents(category?: string): Promise<Event[]> {
  let query = supabase.from("events").select("id,name,description,rules,price,min_team_size,max_team_size,category").order("created_at", { ascending: true });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Event[];
}
