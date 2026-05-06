import { useTournament } from "../context/TournamentContext";

const LETTERS = ["A", "B", "C", "D"] as const;

export function GroupsPage() {
  const { teams, loading, error } = useTournament();

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;
  if (error && teams.length === 0) return <p className="empty">{error}</p>;

  return (
    <main>
      <h1 className="page-title">Groups</h1>
      <p className="subtitle">Four groups of three teams each.</p>
      <div className="grid-2">
        {LETTERS.map((L) => {
          const groupTeams = teams.filter((t) => t.group_letter === L).sort((a, b) => a.group_order - b.group_order);
          return (
            <section key={L} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span className="badge">Group {L}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {groupTeams.length} teams
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                {groupTeams.map((t) => (
                  <li key={t.id}>{t.name}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
