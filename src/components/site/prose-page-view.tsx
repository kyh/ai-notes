import Link from "next/link";

import { ProseList } from "@/components/site/prose-link";
import type { ProseBlock, ProsePage } from "@/lib/agent/site-content";
import { siteConfig } from "@/lib/config";

const Block = ({ block }: { block: ProseBlock }) => {
  switch (block.kind) {
    case "paragraph": {
      return <p>{block.text}</p>;
    }
    case "heading": {
      return <h2 className="pt-4 text-lg font-semibold text-foreground">{block.text}</h2>;
    }
    case "list": {
      return <ProseList items={block.items} />;
    }
    default: {
      return block satisfies never;
    }
  }
};

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
];

export const ProsePageView = ({ page }: { page: ProsePage }) => (
  <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-6 py-12 leading-7 text-muted-foreground">
    <Link className="text-sm font-semibold tracking-tight text-foreground" href="/">
      {siteConfig.name}
    </Link>
    <h1 className="pt-6 text-3xl font-semibold tracking-tight text-foreground">{page.heading}</h1>
    {page.blocks.map((block, index) => (
      <Block block={block} key={index} />
    ))}
    <nav className="mt-auto flex gap-4 border-t pt-6 text-sm">
      {footerLinks.map((link) => (
        <Link className="hover:text-foreground" href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  </main>
);
