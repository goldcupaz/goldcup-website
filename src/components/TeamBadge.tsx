import { teamLogoSrc } from "../lib/teamLogos";

type Props = {
  name: string;
  size?: "sm" | "md" | "lg" | "hero";
  priority?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function TeamBadge({ name, size = "md", priority = false }: Props) {
  const logo = teamLogoSrc(name);

  if (logo) {
    return (
      <span className={`team-badge team-badge--${size} team-badge--logo`}>
        <img
          src={logo}
          alt={`${name} logo`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          width={size === "hero" ? 80 : size === "lg" ? 52 : size === "sm" ? 28 : 36}
          height={size === "hero" ? 80 : size === "lg" ? 52 : size === "sm" ? 28 : 36}
        />
      </span>
    );
  }

  return (
    <span className={`team-badge team-badge--${size}`} aria-hidden>
      {initials(name)}
    </span>
  );
}
