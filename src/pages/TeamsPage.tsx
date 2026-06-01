import { Link } from "react-router-dom";

import { TeamBadge } from "../components/TeamBadge";
import { useTournament } from "../context/TournamentContext";

export function TeamsPage() {
  const { teams, loading, error } = useTournament();

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  const sorted = [...teams].sort((a, b) => {
    const ga = a.group_letter ?? "";
    const gb = b.group_letter ?? "";
    if (ga !== gb) return ga.localeCompare(gb);
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="teams-page teams-page--premium">
      <h1 className="page-title">Teams</h1>
      {error && <div className="alert warn">{error}</div>}
      <div className="teams-premium-grid">
        {sorted.map((t) => (
          <Link key={t.id} className="team-premium-card" to={`/teams/${t.id}`}>
            <TeamBadge name={t.name} size="lg" />
            <span className="team-premium-card__name">{t.name}</span>
            <span className="team-premium-card__group">Group {t.group_letter}</span>
          </Link>
        ))}
      </div>
      <p className="muted teams-page__more">
        <Link to="/statistics">Player &amp; team statistics →</Link>
      </p>
    </main>
  );
}
