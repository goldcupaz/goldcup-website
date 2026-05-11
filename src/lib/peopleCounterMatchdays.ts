/** Entrance people counter slots (DB `people_counter.id`). Must match migration + RPC allowlist. */
export const PEOPLE_COUNTER_MATCHDAYS = [
  { id: "md3", title: "Matchday 3", dateLine: "23 May" },
  { id: "md4", title: "Matchday 4", dateLine: "24 May" },
  { id: "md5", title: "Matchday 5", dateLine: "30 May" },
  { id: "md6", title: "Matchday 6", dateLine: "5 June" },
] as const;

export const PEOPLE_COUNTER_IDS = PEOPLE_COUNTER_MATCHDAYS.map((d) => d.id);
