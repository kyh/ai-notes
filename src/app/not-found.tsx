import { ProsePageView } from "@/components/site/prose-page-view";
import { prosePages } from "@/lib/agent/site-content";
import type { ProsePage } from "@/lib/agent/site-content";

const notFoundPage: ProsePage = {
  blocks: [
    { kind: "paragraph", text: "There is nothing at this address. Try one of these instead." },
    {
      items: [
        { href: "/", label: "Open the notes app" },
        ...prosePages.map((page) => ({ href: page.path, label: page.title })),
        { href: "/sitemap.xml", label: "Sitemap" },
      ],
      kind: "list",
    },
  ],
  description: "Page not found.",
  heading: "Page not found",
  path: "/404",
  title: "Not found",
};

const NotFound = () => <ProsePageView page={notFoundPage} />;

export default NotFound;
