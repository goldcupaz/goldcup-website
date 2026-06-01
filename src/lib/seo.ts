/** Canonical site URL (no trailing slash). Set VITE_SITE_URL on Netlify for custom domains. */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, "") ||
  "https://goldcupaz.netlify.app"
).replace(/\/$/, "");

export const SITE_NAME = "Gold Cup Azerbaijan";

export const DEFAULT_TITLE = "Gold Cup Azerbaijan | Youth Mini Football Tournament in Baku";

export const DEFAULT_DESCRIPTION =
  "Gold Cup Azerbaijan is a youth mini football tournament in Baku with live fixtures, standings, teams, match results, fan zone, sponsors, statistics, and final event updates.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/goldcup-og.png`;

export const OG_TITLE = "Gold Cup Azerbaijan | Youth Mini Football Tournament in Baku";

export const OG_DESCRIPTION =
  "Follow Gold Cup Azerbaijan for fixtures, standings, teams, results, fan zone updates, sponsors, and live match information.";

export const TWITTER_TITLE = "Gold Cup Azerbaijan";

export const TWITTER_DESCRIPTION =
  "Youth mini football tournament in Baku with fixtures, standings, teams, fan zone, statistics, and live updates.";

export type PageSeo = {
  title: string;
  description: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const ROUTE_SEO: Record<string, PageSeo> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    jsonLd: [buildSportsEventJsonLd(), buildWebSiteJsonLd()],
  },
  "/fixtures": {
    title: "Gold Cup Fixtures & Results | Gold Cup Azerbaijan",
    description:
      "Gold Cup Azerbaijan fixtures and results: group stage, quarter-finals, semi-finals, third place, and final. Live scores and match details for the youth mini football tournament in Baku.",
  },
  "/standings": {
    title: "Gold Cup Standings | Gold Cup Azerbaijan",
    description:
      "Group standings for Gold Cup Azerbaijan — points, wins, draws, losses, and goal difference for every team in the Baku youth mini football tournament.",
  },
  "/teams": {
    title: "Gold Cup Teams | Gold Cup Azerbaijan",
    description:
      "Explore teams at Gold Cup Azerbaijan: squads, groups, and player lists for the youth mini football tournament in Baku.",
  },
  "/statistics": {
    title: "Gold Cup Player & Team Statistics | Gold Cup Azerbaijan",
    description:
      "Top scorers, assists, and team statistics from Gold Cup Azerbaijan — the youth mini football tournament in Baku.",
  },
  "/sponsors": {
    title: "Gold Cup Sponsors & Partners | Gold Cup Azerbaijan",
    description:
      "Gold Cup Azerbaijan sponsors and partners supporting youth football, school teams, and the mini football tournament in Baku.",
  },
  "/fanzone": {
    title: "Gold Cup Fanzone | Gold Cup Azerbaijan",
    description:
      "Gold Cup fan zone in Baku: follow live updates, social channels, registration, and the youth football tournament atmosphere at Gold Cup Azerbaijan.",
  },
  "/tickets": {
    title: "Gold Cup Tickets | Gold Cup Azerbaijan",
    description: "Buy official Gold Cup Azerbaijan tickets through iTicket.",
  },
  "/rules": {
    title: "Gold Cup Rules & Fair Play | Gold Cup Azerbaijan",
    description:
      "Tournament rules and fair play standards for Gold Cup Azerbaijan — respect, safety, and competitive youth mini football in Baku.",
  },
  "/live": {
    title: "Gold Cup Live Match | Gold Cup Azerbaijan",
    description: "Live match centre for Gold Cup Azerbaijan with scores, timeline, and real-time tournament updates in Baku.",
  },
  "/groups": {
    title: "Gold Cup Groups | Gold Cup Azerbaijan",
    description: "Group stage draw and fixtures for Gold Cup Azerbaijan youth mini football tournament in Baku.",
  },
  "/knockout": {
    title: "Gold Cup Knockout Bracket | Gold Cup Azerbaijan",
    description: "Knockout path for Gold Cup Azerbaijan: quarter-finals, semi-finals, third place, and final.",
  },
  "/about": {
    title: "About Gold Cup Azerbaijan | Youth Mini Football Tournament in Baku",
    description:
      "About Gold Cup Azerbaijan — mission, tournament experience, community, sponsors, and youth football in Baku.",
  },
  "/links": {
    title: "Gold Cup Links & Registration | Gold Cup Azerbaijan",
    description: "Official Gold Cup Azerbaijan social media, team registration, and volunteer links.",
  },
};

const NOINDEX_PREFIXES = ["/admin", "/volunteer"];

export function seoForPath(pathname: string): PageSeo | null {
  const path = pathname.split("?")[0] || "/";
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

  if (NOINDEX_PREFIXES.some((p) => normalized === p || normalized.startsWith(`${p}/`))) {
    return {
      title: "Gold Cup Admin",
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    };
  }

  if (normalized.startsWith("/matches/")) return null;

  if (normalized.startsWith("/teams/") && normalized !== "/teams") {
    return {
      title: "Gold Cup Team | Gold Cup Azerbaijan",
      description: "Team profile, fixtures, and results at Gold Cup Azerbaijan youth mini football tournament in Baku.",
    };
  }

  return ROUTE_SEO[normalized] ?? {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  };
}

export function canonicalUrl(pathname: string): string {
  const path = pathname.split("?")[0] || "/";
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}

export function buildSportsEventJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Gold Cup Azerbaijan",
    description:
      "Gold Cup Azerbaijan is a youth mini football tournament in Baku with school teams, live fixtures, standings, fan zone, and final matchday events.",
    sport: "Football",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Baku, Azerbaijan",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Baku",
        addressCountry: "AZ",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Gold Cup",
      url: SITE_URL,
    },
    url: SITE_URL,
  };
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en",
  };
}

/** Paths included in sitemap.xml (public, indexable). */
export const SITEMAP_PATHS = [
  "/",
  "/fixtures",
  "/matches",
  "/standings",
  "/teams",
  "/statistics",
  "/sponsors",
  "/fanzone",
  "/tickets",
  "/rules",
  "/live",
  "/about",
  "/groups",
  "/knockout",
  "/links",
] as const;
