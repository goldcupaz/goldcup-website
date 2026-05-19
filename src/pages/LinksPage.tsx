import { GoldCupSocialLinks } from "../components/GoldCupSocialLinks";
import { trackTeamRegistrationClick, trackTicketClick, trackVolunteerRegistrationClick } from "../lib/websiteAnalytics";

const EXTERNAL = "noopener noreferrer";

const REGISTRATION = [
  {
    label: "Volunteer registration",
    href: "https://forms.gle/MBKhppA1qDquAgfw8",
    event: "volunteer" as const,
  },
  { label: "Team registration", href: "http://forms.gle/wGk6qbPtYJyDDrdw6", event: "team" as const },
] as const;

const ticketsUrl = (import.meta.env.VITE_TICKETS_URL as string | undefined)?.trim();

export function LinksPage() {
  return (
    <main className="links-page">
      <h1 className="page-title">Links</h1>
      <p className="subtitle">Official Gold Cup social channels and registration forms. All links open in a new tab.</p>

      <section className="card links-section">
        <h2 className="section-title">Social media</h2>
        <GoldCupSocialLinks variant="list" source="links_page" />
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
                onClick={() => {
                  const base = { label: s.label, href: s.href, source: "links_page" };
                  if (s.event === "volunteer") trackVolunteerRegistrationClick(base);
                  else trackTeamRegistrationClick(base);
                }}
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
