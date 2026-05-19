import {
  EXTERNAL_LINK_REL,
  GOLD_CUP_SOCIAL_LINKS,
  trackGoldCupSocialClick,
  type GoldCupSocialLink,
} from "../lib/goldCupSocial";

type Variant = "list" | "footer" | "menu";

type Props = {
  variant: Variant;
  /** Analytics source tag (e.g. footer_about, links_page). */
  source: string;
  className?: string;
  onItemClick?: () => void;
};

function handleClick(link: GoldCupSocialLink, source: string, onItemClick?: () => void) {
  trackGoldCupSocialClick(link, source);
  onItemClick?.();
}

export function GoldCupSocialLinks({ variant, source, className, onItemClick }: Props) {
  if (variant === "list") {
    return (
      <ul className={["links-list", className].filter(Boolean).join(" ")} aria-label="Gold Cup social media">
        {GOLD_CUP_SOCIAL_LINKS.map((link) => (
          <li key={link.id}>
            <a
              className="links-item"
              href={link.href}
              target="_blank"
              rel={EXTERNAL_LINK_REL}
              onClick={() => handleClick(link, source, onItemClick)}
            >
              <span className="links-item-label">{link.label}</span>
              <span className="links-item-arrow" aria-hidden>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "footer") {
    return (
      <div className={["goldcup-social goldcup-social--footer", className].filter(Boolean).join(" ")} aria-label="Gold Cup social media">
        {GOLD_CUP_SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            className="goldcup-social-link"
            href={link.href}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            aria-label={`Gold Cup on ${link.label}`}
            onClick={() => handleClick(link, source, onItemClick)}
          >
            {link.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={["goldcup-social goldcup-social--menu", className].filter(Boolean).join(" ")} role="group" aria-label="Gold Cup social media">
      {GOLD_CUP_SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          className="nav-more-item nav-more-item--external"
          href={link.href}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          role="menuitem"
          onClick={() => handleClick(link, source, onItemClick)}
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}
