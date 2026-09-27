import { siteConfig } from "../config";
import { introParagraphs, prosePages, siteSummary, whenToUse } from "./site-content";
import type { ProseBlock, ProseLink, ProsePage } from "./site-content";

export const absoluteUrl = (href: string): string =>
  href.startsWith("/") ? `${siteConfig.url}${href === "/" ? "" : href}` : href;

const renderLink = ({ href, label, text }: ProseLink): string => {
  const head = href === undefined ? `**${label}**` : `[${label}](${absoluteUrl(href)})`;
  return text === undefined ? `- ${head}` : `- ${head}: ${text}`;
};

const renderList = (items: ProseLink[]): string => items.map(renderLink).join("\n");

const renderBlock = (block: ProseBlock): string => {
  switch (block.kind) {
    case "paragraph": {
      return block.text;
    }
    case "heading": {
      return `## ${block.text}`;
    }
    case "list": {
      return renderList(block.items);
    }
    default: {
      return block satisfies never;
    }
  }
};

const finish = (sections: string[]): string => `${sections.join("\n\n").trimEnd()}\n`;

const pageLinks: ProseLink[] = [
  { href: "/", label: "Home", text: "the notes app itself" },
  ...prosePages.map((page) => ({ href: page.path, label: page.title, text: page.description })),
];

const agentLinks: ProseLink[] = [
  { href: "/llms.txt", label: "llms.txt", text: "this overview for language models" },
  { href: "/sitemap.xml", label: "sitemap.xml", text: "every indexable URL" },
  {
    label: "Markdown for any page",
    text: "send `Accept: text/markdown` to a page URL and the same content comes back as Markdown",
  },
];

export const renderProsePageMarkdown = (page: ProsePage): string =>
  finish([`# ${page.heading}`, `> ${page.description}`, ...page.blocks.map(renderBlock)]);

export const renderHomeMarkdown = (): string =>
  finish([
    `# ${siteConfig.name}`,
    `> ${siteSummary}`,
    ...introParagraphs,
    "## When to use it",
    renderList(whenToUse),
    "## Pages",
    renderList(pageLinks),
  ]);

export const renderNotFoundMarkdown = (path: string): string =>
  finish([
    "# Not found",
    `Nothing lives at \`${path}\` on ${siteConfig.name}. The site has only a handful of pages; start from one of these.`,
    renderList([...pageLinks, ...agentLinks]),
  ]);

/**
 * llmstxt.org shape: H1, blockquote summary, heading-free prose, then H2 link
 * lists. The when-to-use guidance stays in the prose block because the spec
 * reserves H2 sections for links.
 */
export const renderLlmsTxt = (): string =>
  finish([
    `# ${siteConfig.name}`,
    `> ${siteSummary}`,
    ...introParagraphs,
    `**When to use ${siteConfig.name}:**`,
    renderList(whenToUse),
    "## Pages",
    renderList(pageLinks),
    "## Machine-readable",
    renderList(agentLinks),
    "## Optional",
    renderList([
      { href: siteConfig.repository, label: "Source code", text: "the template, on GitHub" },
      {
        href: `${siteConfig.repository}/issues`,
        label: "Issue tracker",
        text: "bugs and feature requests",
      },
    ]),
  ]);
