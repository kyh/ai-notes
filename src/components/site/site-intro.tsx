import { ProseList } from "@/components/site/prose-link";
import { introParagraphs, prosePages, whenToUse } from "@/lib/agent/site-content";
import { siteConfig } from "@/lib/config";

/**
 * The app shell renders nothing but skeletons until it hydrates from local
 * storage, so crawlers and assistive tech get the product description from
 * this server-rendered, visually hidden section instead.
 */
export const SiteIntro = () => (
  <section aria-label={`About ${siteConfig.name}`} className="sr-only">
    <h2>What {siteConfig.name} is</h2>
    {introParagraphs.map((text) => (
      <p key={text}>{text}</p>
    ))}
    <h2>When to use {siteConfig.name}</h2>
    <ProseList items={whenToUse} />
    <h2>More</h2>
    <ProseList
      items={[
        ...prosePages.map((page) => ({ href: page.path, label: page.title })),
        { href: "/llms.txt", label: "llms.txt" },
        { href: siteConfig.repository, label: "Source code on GitHub" },
      ]}
    />
  </section>
);
