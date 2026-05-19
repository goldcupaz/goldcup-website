import {
  trackInstagramClick,
  trackTeamRegistrationClick,
  trackTicketClick,
  trackTiktokClick,
  trackVolunteerRegistrationClick,
  trackYoutubeClick,
} from "../lib/websiteAnalytics";

const EXTERNAL = "noopener noreferrer";

const SOCIAL = [
  { label: "TikTok", href: "http://www.tiktok.com/@goldcup.az", event: "tiktok" as const },
  { label: "Instagram", href: "https://www.instagram.com/goldcup.az", event: "instagram" as const },
  { label: "YouTube", href: "https://www.youtube.com/@GoldCupAzerbaijan", event: "youtube" as const },
] as const;

const REGISTRATION = [
  {
    label: "Volunteer registration",
    href: "https://forms.gle/MBKhppA1qDquAgfw8",
    event: "volunteer" as const,
  },
  { label: "Team registration", href: "http://forms.gle/wGk6qbPtYJyDDrdw6", event: "team" as const },
] as const;

const ticketsUrl = (import.meta.env.VITE_TICKETS_URL as string | undefined)?.trim();

function onSocialClick(event: (typeof SOCIAL)[number]["event"], item: (typeof SOCIAL)[number]) {
  const base = { label: item.label, href: item.href, source: "links_page" };
  if (event === "instagram") trackInstagramClick(base);
  else if (event === "tiktok") trackTiktokClick(base);
  else if (event === "youtube") trackYoutubeClick(base);
}

function onRegistrationClick(item: (typeof REGISTRATION)[number]) {
  const base = { label: item.label, href: item.href, source: "links_page" };
  if (item.event === "volunteer") trackVolunteerRegistrationClick(base);
  else trackTeamRegistrationClick(base);
}

export function LinksPage() {
  return (
    <main className="links-page">
      <h1 className="page-title">Links</h1>
      <p className="subtitle">Official Gold Cup social channels and registration forms. All links open in a new tab.</p>

      <section className="card links-section">
        <h2 className="section-title">Social media</h2>
        <ul className="links-list">
          {SOCIAL.map((s) => (
            <li key={s.href}>
              <a
                className="links-item"
                href={s.href}
                target="_blank"
                rel={EXTERNAL}
                onClick={() => onSocialClick(s.event, s)}
              >
                <span className="links-item-label">{s.label}</span>
                <span className="links-item-arrow">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="card links-section">
        <h2 className="section-title">Registration</h2>
        <ul className="links-list">
          {REGISTRATION.map((s) => (
            <li key={s.href}>
              <a
                className="links-item"
                href={s.href}
                target="_blank"
                rel={EXTERNAL}
                onClick={() => onRegistrationClick(s)}
              >
                <span className="links-item-label">{s.label}</span>
                <span className="links-item-arrow">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {ticketsUrl ? (
        <section className="card links-section">
          <h2 className="section-title">Tickets</h2>
          <ul className="links-list">
            <li>
              <a
                className="links-item"
                href={ticketsUrl}
                target="_blank"
                rel={EXTERNAL}
                onClick={() => trackTicketClick({ label: "Get tickets", href: ticketsUrl, source: "links_page" })}
              >
                <span className="links-item-label">Get tickets</span>
                <span className="links-item-arrow">↗</span>
              </a>
            </li>
          </ul>
        </section>
      ) : null}
    </main>
  );
}
