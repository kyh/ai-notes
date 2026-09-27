import type { Metadata } from "next";

import { siteConfig } from "../config";
import type { ProsePage } from "./site-content";

const ogImage = { height: 1080, url: `${siteConfig.url}/og.jpg`, width: 1920 };

/**
 * Next replaces, not merges, a page's `openGraph` over the layout's, so the
 * type and image are restated here or the page silently loses them.
 */
export const prosePageMetadata = (page: ProsePage): Metadata => ({
  alternates: { canonical: page.path },
  description: page.description,
  openGraph: {
    description: page.description,
    images: [ogImage],
    locale: "en-US",
    siteName: siteConfig.name,
    title: page.title,
    type: "website",
    url: page.path,
  },
  title: page.title,
});
