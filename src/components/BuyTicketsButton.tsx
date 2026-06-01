import { ITICKET_URL, EXTERNAL_LINK_REL } from "../lib/tickets";
import { TicketIcon } from "./TicketIcon";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function BuyTicketsButton({ size = "md", className = "" }: Props) {
  return (
    <a
      href={ITICKET_URL}
      target="_blank"
      rel={EXTERNAL_LINK_REL}
      className={`btn-buy-tickets btn-buy-tickets--${size}${className ? ` ${className}` : ""}`}
    >
      <TicketIcon className="btn-buy-tickets__icon" />
      <span>Buy Tickets</span>
    </a>
  );
}
