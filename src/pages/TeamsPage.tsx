import { useMemo, useState } from "react";

import { useTournament } from "../context/TournamentContext";

export function TeamsPage() {
  const { teams, players, loading, error } = useTournament();
  const [openId, setOpenId] = useState<string | null>(null);

  const byTeam = useMemo(() => {
    const m = new Map<string, typeof players>();
    for (const p of players) {
      const arr = m.get(p.team_id) ?? [];
      arr.push(p);
      m.set(p.team_id, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    return m;
  }, [players]);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  const openTeam = openId ? teams.find((t) => t.id === openId) : null;
  const roster = openId ? byTeam.get(openId) ?? [] : [];

  return (
    <main>
      <h1 className="page-title">Teams</h1>
      <p className="subtitle">Select a team to view the registered squad.</p>
      {error && <div className="alert warn">{error}</div>}

      <div className="team-grid">
        {teams.map((t) => (
          <button key={t.id} type="button" className="team-card-btn" onClick={() => setOpenId(t.id)}>
            {t.name}{" "}
            <span className="muted" style={{ display: "block", fontWeight: 600, fontSize: 12, marginTop: 4 }}>
              Group {t.group_letter}
            </span>
          </button>
        ))}
      </div>

      {openTeam && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal
          aria-labelledby="team-modal-title"
          onClick={() => setOpenId(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2 id="team-modal-title">{openTeam.name}</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpenId(null)}>
                ×
              </button>
            </header>
            <div className="body">
              {roster.length === 0 ? (
                <p className="muted">No players listed yet. Admins can add names in the admin panel.</p>
              ) : (
                <ul className="players" style={{ margin: 0, paddingLeft: 18 }}>
                  {roster.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
