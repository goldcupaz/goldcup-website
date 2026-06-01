import mtkEaglesLogo from "../assets/teams/mtk-eagles.png";
import samboFcLogo from "../assets/teams/sambo-fc.png";

/** Normalized team name → crest image (add more teams here as assets arrive). */
const LOGO_BY_NAME: Record<string, string> = {
  "mtk eagles": mtkEaglesLogo,
  "sambo fc": samboFcLogo,
};

export function teamLogoSrc(teamName: string | null | undefined): string | null {
  if (!teamName?.trim()) return null;
  return LOGO_BY_NAME[teamName.trim().toLowerCase()] ?? null;
}

export function hasTeamLogo(teamName: string | null | undefined): boolean {
  return teamLogoSrc(teamName) !== null;
}
