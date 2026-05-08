import type { MatchStatus } from "./database.types";

/** Match is in play or interval (show live badge / score on bracket). */
export function isMatchInPlayOrBreak(status: MatchStatus): boolean {
  return (
    status === "live_first_half" || status === "half_time" || status === "live_second_half"
  );
}

/** Use current score for standings / goal tables while match is live or finished. */
export function countsForStandingsScore(status: MatchStatus): boolean {
  return (
    status === "live_first_half" ||
    status === "half_time" ||
    status === "live_second_half" ||
    status === "full_time"
  );
}
