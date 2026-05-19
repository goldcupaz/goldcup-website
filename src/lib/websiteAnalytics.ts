import { isSupabaseConfigured, supabase } from "./supabase";

export const WEBSITE_EVENT_NAMES = [
  "page_view",
  "instagram_click",
  "tiktok_click",
  "youtube_click",
  "volunteer_registration_click",
  "team_registration_click",
  "sponsor_click",
  "ticket_click",
  "match_page_open",
  "team_page_open",
  "volunteer_login_success",
] as const;

export type WebsiteEventName = (typeof WEBSITE_EVENT_NAMES)[number];

export type WebsiteEventMetadata = Record<string, string | number | boolean | null>;

function currentPagePath(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.pathname || null;
}

/**
 * Record a website analytics event (fire-and-forget).
 * Inserts into `website_events` with current `page_path` and optional `metadata`.
 */
export function trackWebsiteEvent(eventName: WebsiteEventName | string, metadata: WebsiteEventMetadata = {}): void {
  if (!isSupabaseConfigured) return;

  const page_path = currentPagePath();

  void supabase
    .from("website_events")
    .insert({
      event_name: eventName,
      page_path,
      metadata,
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[analytics]", eventName, error.message);
      }
    });
}

export function trackPageView(): void {
  if (typeof window === "undefined") return;
  trackWebsiteEvent("page_view", {
    pathname: window.location.pathname,
    full_url: window.location.href,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  });
}

export function trackInstagramClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("instagram_click", metadata);
}

export function trackTiktokClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("tiktok_click", metadata);
}

export function trackYoutubeClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("youtube_click", metadata);
}

export function trackVolunteerRegistrationClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("volunteer_registration_click", metadata);
}

export function trackTeamRegistrationClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("team_registration_click", metadata);
}

export function trackSponsorClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("sponsor_click", metadata);
}

export function trackTicketClick(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("ticket_click", metadata);
}

export function trackVolunteerLoginSuccess(metadata: WebsiteEventMetadata = {}): void {
  trackWebsiteEvent("volunteer_login_success", metadata);
}

export function trackTeamPageOpen(teamId: string, teamName?: string): void {
  trackWebsiteEvent("team_page_open", { team_id: teamId, team_name: teamName ?? null });
}

export function trackMatchPageOpen(matchId: string): void {
  trackWebsiteEvent("match_page_open", { match_id: matchId });
}
