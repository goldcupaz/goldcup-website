import type { Database } from "./database.types";
import { FINAL_FIXTURE, THIRD_PLACE_FIXTURE } from "./knockoutBracket";

type MatchRow = Pick<Database["public"]["Tables"]["matches"]["Row"], "stage" | "slot_code">;

/** Public/admin label for knockout round column. */
export function matchRoundLabel(m: MatchRow): string {
  if (m.stage === "final" && m.slot_code === FINAL_FIXTURE.slot) return "Final";
  if (m.stage === "third" && m.slot_code === THIRD_PLACE_FIXTURE.slot) return "Third Place";
  if (m.stage === "qf" && m.slot_code) return m.slot_code;
  if (m.stage === "sf" && m.slot_code) return m.slot_code;
  if (m.stage === "final") return "Final";
  if (m.stage === "third") return "Third Place";
  return m.slot_code ?? m.stage;
}
