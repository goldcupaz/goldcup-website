import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { TournamentProvider } from "./context/TournamentContext";
import { AdminEntry } from "./pages/AdminEntry";
import { AdminLogin } from "./pages/AdminLogin";
import { FixturesPage } from "./pages/FixturesPage";
import { GroupsPage } from "./pages/GroupsPage";
import { Home } from "./pages/Home";
import { KnockoutPage } from "./pages/KnockoutPage";
import { LiveMatchPage } from "./pages/LiveMatchPage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { SponsorsPage } from "./pages/SponsorsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { StandingsPage } from "./pages/StandingsPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { TeamsPage } from "./pages/TeamsPage";
import { VolunteerHub } from "./pages/VolunteerHub";
import { LinksPage } from "./pages/LinksPage";
import { AboutPage } from "./pages/AboutPage";
import { FanzonePage } from "./pages/FanzonePage";
import { RulesPage } from "./pages/RulesPage";
import { TicketsPage } from "./pages/TicketsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="standings" element={<StandingsPage />} />
              <Route path="fixtures" element={<FixturesPage />} />
              <Route path="matches" element={<Navigate to="/fixtures" replace />} />
              <Route path="matches/:matchId" element={<MatchDetailPage />} />
              <Route path="fanzone" element={<FanzonePage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route path="live" element={<LiveMatchPage />} />
              <Route path="teams/:teamId" element={<TeamDetailPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="knockout" element={<KnockoutPage />} />
              <Route path="sponsors" element={<SponsorsPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="admin" element={<AdminEntry />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="volunteer" element={<VolunteerHub />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TournamentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
