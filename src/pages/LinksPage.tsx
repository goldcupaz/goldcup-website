const EXTERNAL = "noopener noreferrer";

const SOCIAL = [
  { label: "TikTok", href: "http://www.tiktok.com/@goldcup.az" },
  { label: "Instagram", href: "https://www.instagram.com/goldcup.az" },
  { label: "YouTube", href: "https://www.youtube.com/@GoldCupAzerbaijan" },
] as const;

const REGISTRATION = [
  { label: "Volunteer registration", href: "https://forms.gle/MBKhppA1qDquAgfw8" },
  { label: "Team registration", href: "http://forms.gle/wGk6qbPtYJyDDrdw6" },
] as const;

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
              <a className="links-item" href={s.href} target="_blank" rel={EXTERNAL}>
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
              <a className="links-item" href={s.href} target="_blank" rel={EXTERNAL}>
                <span className="links-item-label">{s.label}</span>
                <span className="links-item-arrow">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
