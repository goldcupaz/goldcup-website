/** Shared volunteer gate password (client-visible; use RLS on data). */
export const VOLUNTEER_GATE_PASSWORD = "goldcupaz";

export function volunteerSupabaseEmail(): string | undefined {
  const v = import.meta.env.VITE_VOLUNTEER_EMAIL;
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}
