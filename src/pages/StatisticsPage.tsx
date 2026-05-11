import { useMemo } from "react";

import { useTournament } from "../context/TournamentContext";
import {
  buildDisciplineBlocks,
  buildTeamStatBlocks,
  ownGoalLeaders,
  topScorersWithTeams,
} from "../lib/tournamentStatistics";

function StatTable({
  title,
  rows,
  valueLabel,
  empty,
  formatValue,
  nameHeader = "Team",
}: {
  title: string;
  rows: { rank: number; label: string; value: number }[];
  valueLabel: string;
  empty: string;
  formatValue?: (n: number) => string;
  nameHeader?: string;
}) {
  return (
    <section className="card stat-card">
      <h2 className="stat-card-title">{title}</h2>
      {rows.length === 0 ? (
        <p className="muted stat-card-empty">{empty}</p>
      ) : (
        <div className="table-wrap stat-table-wrap">
          <table className="stat-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{nameHeader}</th>
                <th>{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.rank}-${r.label}`}>
                  <td className="stat-td-rank">{r.rank}</td>
                  <td className="stat-td-name">{r.label}</td>
                  <td className="stat-td-val">{formatValue ? formatValue(r.value) : r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatGd(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function StatisticsPage() {
  const { teams, matches, matchEvents, loading, error } = useTournament();

  const teamBlocks = useMemo(() => buildTeamStatBlocks(matches, teams), [matches, teams]);
  const discipline = useMemo(() => buildDisciplineBlocks(matchEvents, teams), [matchEvents, teams]);
  const scorers = useMemo(() => topScorersWithTeams(matchEvents, teams, 25), [matchEvents, teams]);
  const ogs = useMemo(() => ownGoalLeaders(matchEvents, teams, 15), [matchEvents, teams]);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="stat-page">
      <h1 className="page-title">Statistics</h1>
      <p className="subtitle">
        Live view from match scores and timeline events (goals, cards, own goals). Updates as matches progress.
      </p>
      {error && <div className="alert warn">{error}</div>}

      <h2 className="stat-section-heading">Team</h2>
      <div className="stat-grid">
        <StatTable title="Most goals scored" rows={teamBlocks.mostGoalsScored} valueLabel="GF" empty="No scored goals yet." />
        <StatTable title="Most goals conceded" rows={teamBlocks.mostGoalsConceded} valueLabel="GA" empty="No completed matches yet." />
        <StatTable title="Least goals conceded" rows={teamBlocks.leastGoalsConceded} valueLabel="GA" empty="No completed matches yet." />
        <StatTable title="Most wins" rows={teamBlocks.mostWins} valueLabel="W" empty="No wins recorded yet." />
        <StatTable
          title="Highest goal difference"
          rows={teamBlocks.bestGd}
          valueLabel="GD"
          empty="No completed matches yet."
          formatValue={formatGd}
        />
      </div>

      <h2 className="stat-section-heading">Discipline</h2>
      <div className="stat-grid">
        <StatTable
          title="Most yellow cards"
          rows={discipline.mostYellows}
          valueLabel="Cards"
          empty="No yellow cards in timeline yet."
        />
        <StatTable title="Most red cards" rows={discipline.mostReds} valueLabel="Cards" empty="No red cards in timeline yet." />
      </div>

      <h2 className="stat-section-heading">Players</h2>
      <div className="stat-grid stat-grid--wide">
        <section className="card stat-card">
          <h2 className="stat-card-title">Top scorers</h2>
          {scorers.length === 0 ? (
            <p className="muted stat-card-empty">No goal events in timelines yet.</p>
          ) : (
            <div className="table-wrap stat-table-wrap">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>G</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((r) => (
                    <tr key={`${r.rank}-${r.playerName}-${r.teamName}`}>
                      <td className="stat-td-rank">{r.rank}</td>
                      <td className="stat-td-name">{r.playerName}</td>
                      <td className="stat-td-sub">{r.teamName}</td>
                      <td className="stat-td-val">{r.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card stat-card">
          <h2 className="stat-card-title">Own goals</h2>
          {ogs.length === 0 ? (
            <p className="muted stat-card-empty">No own goal events recorded yet.</p>
          ) : (
            <div className="table-wrap stat-table-wrap">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team (conceded)</th>
                    <th>OG</th>
                  </tr>
                </thead>
                <tbody>
                  {ogs.map((r) => (
                    <tr key={`${r.rank}-${r.playerName}-${r.teamName}`}>
                      <td className="stat-td-rank">{r.rank}</td>
                      <td className="stat-td-name">{r.playerName}</td>
                      <td className="stat-td-sub">{r.teamName}</td>
                      <td className="stat-td-val">{r.ownGoals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
