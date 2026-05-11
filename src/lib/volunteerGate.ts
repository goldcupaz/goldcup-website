/** Shared volunteer entrance password (must match DB RPC check). */
export const VOLUNTEER_PASSWORD = "goldcupaz";

const SESSION_KEY = "gc_volunteer_session";

export function isVolunteerSessionOpen(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setVolunteerSession(): void {
  try {
    localStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearVolunteerSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
