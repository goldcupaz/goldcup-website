import azersunLogo from "../assets/sponsors/azersun.png";

export function SponsorsPage() {
  return (
    <main>
      <h1 className="page-title">Sponsors</h1>
      <p className="subtitle">Sponsor logos are placeholders for now.</p>

      <section className="card">
        <h2 className="section-title">Main Sponsors</h2>
        <div className="main-sponsor-grid">
          <div className="sponsor-logo-tile sponsor-logo-tile--main">
            <img className="sponsor-logo" src={azersunLogo} alt="Azersun logo" />
          </div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main">Sponsor Logo</div>
          <div className="sponsor-logo-tile sponsor-logo-tile--main">Sponsor Logo</div>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <section className="card">
          <h2 className="section-title">Official Sponsors</h2>
          <div className="sponsor-grid">
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
          </div>
        </section>
        <section className="card">
          <h2 className="section-title">Partners</h2>
          <div className="sponsor-grid">
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
            <div className="sponsor-tile">Logo</div>
          </div>
        </section>
      </div>
    </main>
  );
}

