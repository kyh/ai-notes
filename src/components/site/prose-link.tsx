import Link from "next/link";

import type { ProseLink } from "@/lib/agent/site-content";

/**
 * Route handlers (`/llms.txt`, `/sitemap.xml`) and off-site URLs must bypass
 * the client router, which would otherwise fetch them as an RSC payload.
 */
const isRouterPage = (href: string): boolean => {
  if (!href.startsWith("/")) {
    return false;
  }
  return !(href.split("/").pop() ?? "").includes(".");
};

const linkClassName = "font-medium underline underline-offset-4 hover:text-foreground";

/** `untabbable` is for lists inside visually hidden blocks, so keyboard focus never lands on something invisible. */
type LinkFocus = "tabbable" | "untabbable";

const ProseAnchor = ({ href, label, focus }: { href: string; label: string; focus: LinkFocus }) => {
  const tabIndex = focus === "untabbable" ? -1 : undefined;
  return isRouterPage(href) ? (
    <Link
      className={linkClassName}
      href={href}
      prefetch={focus === "untabbable" ? false : undefined}
      tabIndex={tabIndex}
    >
      {label}
    </Link>
  ) : (
    <a className={linkClassName} href={href} tabIndex={tabIndex}>
      {label}
    </a>
  );
};

export const ProseList = ({
  items,
  focus = "tabbable",
}: {
  items: ProseLink[];
  focus?: LinkFocus;
}) => (
  <ul className="list-disc space-y-2 pl-5">
    {items.map((item) => (
      <li key={item.label}>
        {item.href === undefined ? (
          <span className="font-medium text-foreground">{item.label}</span>
        ) : (
          <ProseAnchor href={item.href} label={item.label} focus={focus} />
        )}
        {item.text === undefined ? null : `: ${item.text}`}
      </li>
    ))}
  </ul>
);
