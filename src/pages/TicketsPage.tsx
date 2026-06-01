import { Link } from "react-router-dom";

import { BuyTicketsButton } from "../components/BuyTicketsButton";
import logo from "../assets/goldcup-logo.png";

export function TicketsPage() {
  return (
    <main className="tickets-page">
      <div className="tickets-page__hero card">
        <img
          className="tickets-page__logo"
          src={logo}
          alt="Gold Cup Azerbaijan logo"
          width={96}
          height={96}
        />
        <h1 className="page-title tickets-page__title">Official Gold Cup Tickets</h1>
        <p className="tickets-page__desc">
          Secure your place at Gold Cup Azerbaijan. Purchase official tickets through iTicket.
        </p>
        <BuyTicketsButton size="lg" className="tickets-page__cta" />
        <p className="muted tickets-page__back">
          <Link to="/fixtures">View fixtures</Link>
          {" · "}
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </main>
  );
}
