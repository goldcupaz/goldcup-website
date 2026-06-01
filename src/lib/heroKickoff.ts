/** Compact hero line e.g. "7 JUNE • 20:00" */
export function formatHeroKickoff(iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback;
  try {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" })
      .format(d)
      .toUpperCase();
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${day} • ${time}`;
  } catch {
    return fallback;
  }
}
