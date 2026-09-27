import { siteConfig } from "../config";
import { absoluteUrl } from "./markdown";
import { siteSummary } from "./site-content";

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/**
 * No `address` or `telephone`: this is a personal open-source project with no
 * premises, and an invented PostalAddress would be worse than the partial
 * score for leaving it out.
 */
export const buildOrganization = () =>
  ({
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    contactPoint: [
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "customer support",
        email: siteConfig.email,
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "technical support",
        email: siteConfig.email,
        url: `${siteConfig.repository}/issues`,
      },
    ],
    description: siteSummary,
    email: siteConfig.email,
    founder: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
    logo: absoluteUrl("/favicon/favicon-96x96.png"),
    name: siteConfig.name,
    sameAs: siteConfig.sameAs,
    url: siteConfig.url,
  }) satisfies JsonLdNode;

export const buildHomeGraph = () => {
  const graph: JsonLdNode[] = [
    buildOrganization(),
    {
      "@id": WEBSITE_ID,
      "@type": "WebSite",
      description: siteConfig.description,
      inLanguage: "en-US",
      name: siteConfig.name,
      publisher: { "@id": ORGANIZATION_ID },
      url: siteConfig.url,
    },
    {
      "@id": `${siteConfig.url}/#application`,
      "@type": "WebApplication",
      applicationCategory: "ProductivityApplication",
      browserRequirements: "Requires JavaScript and local storage",
      codeRepository: siteConfig.repository,
      description: siteSummary,
      image: absoluteUrl("/og.jpg"),
      isAccessibleForFree: true,
      license: "https://opensource.org/licenses/MIT",
      name: siteConfig.name,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      operatingSystem: "Any",
      publisher: { "@id": ORGANIZATION_ID },
      sameAs: [siteConfig.repository],
      url: siteConfig.url,
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph } satisfies JsonLdNode;
};

/** `<` is escaped so no string in the graph can close the script tag early. */
export const serializeJsonLd = (node: JsonLdNode): string =>
  JSON.stringify(node).replaceAll("<", "\\u003c");
