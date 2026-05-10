import { useMemo, useState } from "react";

import { useTournament } from "../context/TournamentContext";

/**
 * Fast roster lookup for entrance volunteers.
 */
export function VolunteerTeamCheck() {
  const { teams, players, loading } = useTournament();
  const [teamId, setTeamId] = useState("");

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams]);

  const roster = useMemo(() => {
    if (!teamId) return [];
    return players
      .filter((p) => p.team_id === teamId)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [players, teamId]);

  const team = teams.find((t) => t.id === teamId);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <div className="volunteer-team-check">
      <div className="form-row">
        <label htmlFor="vol-team">Team</label>
        <select id="vol-team" className="select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Select a team…</option>
          {sortedTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (Group {t.group_letter})
            </option>
          ))}
        </select>
      </div>

      {!teamId ? (
        <p className="muted volunteer-team-hint">Choose a team to list registered players for name checks at the gate.</p>
      ) : (
        <>
          <h3 className="volunteer-roster-title">{team?.name}</h3>
          <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
            {roster.length} player{roster.length === 1 ? "" : "s"} · verify spelling matches ID or accreditation.
          </p>
          <ul className="volunteer-roster-list">
            {roster.map((p) => (
              <li key={p.id} className={p.is_goalkeeper ? "volunteer-roster-item volunteer-roster-item--gk" : "volunteer-roster-item"}>
                {p.is_goalkeeper && <span className="gk-badge">GK</span>}
                <span className="volunteer-roster-name">{p.name}</span>
              </li>
            ))}
          </ul>
          {roster.length === 0 && <p className="muted">No players on file for this team yet.</p>}
        </>
      )}
    </div>
  );
}
