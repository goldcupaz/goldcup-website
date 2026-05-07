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
import { SponsorsPage } from "./pages/SponsorsPage";
import { StandingsPage } from "./pages/StandingsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { AboutPage } from "./pages/AboutPage";

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
              <Route path="live" element={<LiveMatchPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="knockout" element={<KnockoutPage />} />
              <Route path="sponsors" element={<SponsorsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="admin" element={<AdminEntry />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TournamentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
