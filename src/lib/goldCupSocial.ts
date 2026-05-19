import type { WebsiteEventMetadata } from "./websiteAnalytics";
import {
  trackInstagramClick,
  trackTiktokClick,
  trackYoutubeClick,
} from "./websiteAnalytics";

/** Official Gold Cup tournament social profiles. */
export const GOLD_CUP_SOCIAL_LINKS = [
  {
    id: "tiktok",
    label: "TikTok",
    href: "http://www.tiktok.com/@goldcup.az",
    event: "tiktok_click" as const,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/goldcup.az",
    event: "instagram_click" as const,
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@GoldCupAzerbaijan",
    event: "youtube_click" as const,
  },
] as const;

export type GoldCupSocialLink = (typeof GOLD_CUP_SOCIAL_LINKS)[number];

export const EXTERNAL_LINK_REL = "noopener noreferrer";

export function trackGoldCupSocialClick(link: GoldCupSocialLink, source: string, extra: WebsiteEventMetadata = {}) {
  const metadata: WebsiteEventMetadata = { ...extra, source, href: link.href, label: link.label };
  switch (link.event) {
    case "tiktok_click":
      trackTiktokClick(metadata);
      break;
    case "instagram_click":
      trackInstagramClick(metadata);
      break;
    case "youtube_click":
      trackYoutubeClick(metadata);
      break;
  }
}
