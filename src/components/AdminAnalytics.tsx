import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

type WebsiteEventRow = {
  id: string;
  event_name: string;
  page_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type PageVisitRow = { path: string; visits: number };

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function metadataPreview(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v == null || v === "") continue;
    if (k === "user_agent") continue;
    const s = String(v);
    parts.push(`${k}: ${s.length > 48 ? `${s.slice(0, 45)}…` : s}`);
  }
  return parts.length ? parts.join(" · ") : "—";
}

async function countEvents(eventName: string, sinceIso?: string): Promise<number> {
  let q = supabase.from("website_events").select("id", { count: "exact", head: true }).eq("event_name", eventName);
  if (sinceIso) q = q.gte("created_at", sinceIso);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}


export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [pageViewsToday, setPageViewsToday] = useState(0);
  const [uniquePages, setUniquePages] = useState(0);
  const [instagramClicks, setInstagramClicks] = useState(0);
  const [tiktokClicks, setTiktokClicks] = useState(0);
  const [youtubeClicks, setYoutubeClicks] = useState(0);
  const [volunteerRegClicks, setVolunteerRegClicks] = useState(0);
  const [teamRegClicks, setTeamRegClicks] = useState(0);
  const [sponsorClicks, setSponsorClicks] = useState(0);
  const [ticketClicks, setTicketClicks] = useState(0);
  const [topPages, setTopPages] = useState<PageVisitRow[]>([]);
  const [recent, setRecent] = useState<WebsiteEventRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStart = startOfTodayIso();
      const [
        totalPv,
        todayPv,
        ig,
        tiktok,
        youtube,
        volReg,
        teamReg,
        sponsor,
        ticket,
        pathsRes,
        recentRes,
      ] = await Promise.all([
        countEvents("page_view"),
        countEvents("page_view", todayStart),
        countEvents("instagram_click"),
        countEvents("tiktok_click"),
        countEvents("youtube_click"),
        countEvents("volunteer_registration_click"),
        countEvents("team_registration_click"),
        countEvents("sponsor_click"),
        countEvents("ticket_click"),
        supabase
          .from("website_events")
          .select("page_path")
          .eq("event_name", "page_view")
          .not("page_path", "is", null)
          .order("created_at", { ascending: false })
          .limit(10000),
        supabase
          .from("website_events")
          .select("id, event_name, page_path, metadata, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (pathsRes.error) throw new Error(pathsRes.error.message);
      if (recentRes.error) throw new Error(recentRes.error.message);

      const pathCounts = new Map<string, number>();
      const uniqueSet = new Set<string>();
      for (const row of pathsRes.data ?? []) {
        const p = row.page_path?.trim();
        if (!p) continue;
        uniqueSet.add(p);
        pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1);
      }
      const sortedPages = [...pathCounts.entries()]
        .map(([path, visits]) => ({ path, visits }))
        .sort((a, b) => b.visits - a.visits || a.path.localeCompare(b.path))
        .slice(0, 15);

      setTotalPageViews(totalPv);
      setPageViewsToday(todayPv);
      setUniquePages(uniqueSet.size);
      setInstagramClicks(ig);
      setTiktokClicks(tiktok);
      setYoutubeClicks(youtube);
      setVolunteerRegClicks(volReg);
      setTeamRegClicks(teamReg);
      setSponsorClicks(sponsor);
      setTicketClicks(ticket);
      setTopPages(sortedPages);
      setRecent((recentRes.data ?? []) as WebsiteEventRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statCards = useMemo(
    () => [
      { label: "Total page views", value: totalPageViews },
      { label: "Page views today", value: pageViewsToday },
      { label: "Unique pages visited", value: uniquePages },
      { label: "Instagram clicks", value: instagramClicks },
      { label: "TikTok clicks", value: tiktokClicks },
      { label: "YouTube clicks", value: youtubeClicks },
      { label: "Volunteer registration", value: volunteerRegClicks },
      { label: "Team registration", value: teamRegClicks },
      { label: "Sponsor clicks", value: sponsorClicks },
      { label: "Ticket clicks", value: ticketClicks },
    ],
    [
      totalPageViews,
      pageViewsToday,
      uniquePages,
      instagramClicks,
      tiktokClicks,
      youtubeClicks,
      volunteerRegClicks,
      teamRegClicks,
      sponsorClicks,
      ticketClicks,
    ],
  );

  return (
    <section className="card admin-analytics">
      <div className="admin-analytics-head">
        <div>
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Analytics
          </h2>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            Reads from <span className="kbd">public.website_events</span>. Page views include pathname, URL, referrer,
            and user agent in metadata.
          </p>
        </div>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="alert warn">{error}</div>}

      <div className="admin-analytics-grid" aria-busy={loading}>
        {statCards.map((c) => (
          <div key={c.label} className="admin-analytics-stat">
            <span className="admin-analytics-stat-label">{c.label}</span>
            <span className="admin-analytics-stat-value">{loading ? "…" : c.value}</span>
          </div>
        ))}
      </div>

      <h3 className="admin-analytics-subhead">Most visited pages</h3>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : topPages.length === 0 ? (
        <p className="muted">No page views recorded yet.</p>
      ) : (
        <div className="table-wrap admin-analytics-table-wrap">
          <table className="admin-analytics-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Page</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((r, i) => (
                <tr key={r.path}>
                  <td>{i + 1}</td>
                  <td className="admin-analytics-path">{r.path}</td>
                  <td className="admin-analytics-num">{r.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="admin-analytics-subhead">Recent events</h3>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : recent.length === 0 ? (
        <p className="muted">No events yet.</p>
      ) : (
        <div className="table-wrap admin-analytics-table-wrap">
          <table className="admin-analytics-table admin-analytics-table--recent">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Page</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((ev) => (
                <tr key={ev.id}>
                  <td className="admin-analytics-when">{formatWhen(ev.created_at)}</td>
                  <td>{ev.event_name}</td>
                  <td className="admin-analytics-path">{ev.page_path ?? "—"}</td>
                  <td className="admin-analytics-meta">{metadataPreview(ev.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
