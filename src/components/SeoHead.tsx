import { useEffect } from "react";

import {
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  OG_DESCRIPTION,
  OG_TITLE,
  TWITTER_DESCRIPTION,
  TWITTER_TITLE,
  type PageSeo,
} from "../lib/seo";

type Props = PageSeo & {
  pathname: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const payload = Array.isArray(data) ? data : [data];
  for (let i = 0; i < payload.length; i += 1) {
    const script = document.createElement("script");
    script.id = payload.length === 1 ? id : `${id}-${i}`;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(payload[i]);
    document.head.appendChild(script);
  }
}

function clearJsonLd(id: string) {
  document.querySelectorAll(`[id^="${id}"]`).forEach((n) => n.remove());
}

export function SeoHead({
  pathname,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  noindex = false,
  jsonLd,
}: Props) {
  useEffect(() => {
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    const ogTitle = pathname === "/" ? OG_TITLE : title;
    const ogDesc = pathname === "/" ? OG_DESCRIPTION : description;

    upsertMeta("property", "og:title", ogTitle);
    upsertMeta("property", "og:description", ogDesc);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
    upsertMeta("property", "og:url", canonicalUrl(pathname));
    upsertMeta("property", "og:site_name", "Gold Cup Azerbaijan");
    upsertMeta("property", "og:locale", "en_GB");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", pathname === "/" ? TWITTER_TITLE : title);
    upsertMeta("name", "twitter:description", pathname === "/" ? TWITTER_DESCRIPTION : description);
    upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);

    if (!noindex) {
      upsertLink("canonical", canonicalUrl(pathname));
    } else {
      const canon = document.querySelector('link[rel="canonical"]');
      canon?.remove();
    }

    clearJsonLd("seo-jsonld");
    if (jsonLd && !noindex) {
      upsertJsonLd("seo-jsonld", jsonLd);
    }
  }, [pathname, title, description, noindex, jsonLd]);

  return null;
}
