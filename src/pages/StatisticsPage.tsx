import { useMemo } from "react";

import { useTournament } from "../context/TournamentContext";
import {
  buildDisciplineBlocks,
  buildTeamStatBlocks,
  ownGoalLeaders,
  topScorersWithTeams,
} from "../lib/tournamentStatistics";

/** Max rows shown per statistics table (full rankings still computed in lib). */
const STATS_MAX = 10;

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
  const displayRows = rows.slice(0, STATS_MAX);
  return (
    <section className="card stat-card">
      <h2 className="stat-card-title">{title}</h2>
      {displayRows.length === 0 ? (
        <p className="muted stat-card-empty">{empty}</p>
      ) : (
        <div className="table-wrap stat-table-wrap">
          <table className="stat-table stat-table--3col">
            <colgroup>
              <col className="stat-col-rank" />
              <col className="stat-col-label" />
              <col className="stat-col-val" />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>{nameHeader}</th>
                <th>{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
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
  const scorers = useMemo(() => topScorersWithTeams(matchEvents, teams, STATS_MAX), [matchEvents, teams]);
  const ogs = useMemo(() => ownGoalLeaders(matchEvents, teams, STATS_MAX), [matchEvents, teams]);

  if (loading && teams.length === 0) return <p className="empty">Loading…</p>;

  return (
    <main className="stat-page">
      <h1 className="page-title">Statistics</h1>
      <p className="subtitle stat-page-subtitle">
        From match scores and timeline events. Top {STATS_MAX} in each list. Updates as matches progress.
      </p>
      {error && <div className="alert warn">{error}</div>}

      <h2 className="stat-section-heading">Player statistics</h2>
      <div className="stat-grid stat-grid--wide">
        <section className="card stat-card">
          <h2 className="stat-card-title">Top scorers</h2>
          {scorers.length === 0 ? (
            <p className="muted stat-card-empty">No goal events in timelines yet.</p>
          ) : (
            <div className="table-wrap stat-table-wrap">
              <table className="stat-table stat-table--player">
                <colgroup>
                  <col className="stat-col-rank" />
                  <col className="stat-col-player" />
                  <col className="stat-col-team" />
                  <col className="stat-col-val" />
                </colgroup>
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

        {ogs.length > 0 ? (
          <section className="card stat-card">
            <h2 className="stat-card-title">Most own goals</h2>
            <div className="table-wrap stat-table-wrap">
              <table className="stat-table stat-table--player">
                <colgroup>
                  <col className="stat-col-rank" />
                  <col className="stat-col-player" />
                  <col className="stat-col-team" />
                  <col className="stat-col-val" />
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
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
          </section>
        ) : null}
      </div>

      <h2 className="stat-section-heading">Team statistics</h2>
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
          title="Most yellow cards received"
          rows={discipline.mostYellows}
          valueLabel="Cards"
          empty="No yellow cards in timeline yet."
        />
        <StatTable
          title="Most red cards received"
          rows={discipline.mostReds}
          valueLabel="Cards"
          empty="No red cards in timeline yet."
        />
      </div>
    </main>
  );
}
