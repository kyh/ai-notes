import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tiny hand-rolled markdown renderer for a safe subset:
 * headings (#..###), paragraphs, bold, italic, inline code, links,
 * fenced code blocks, blockquotes, hr, ordered/unordered lists, and
 * task-list checkboxes. Renders React nodes directly — no HTML strings,
 * no dangerouslySetInnerHTML.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^()\s]+\))/g;

const LINK_PATTERN = /^\[([^\]]+)\]\(([^()\s]+)\)$/;

const isSafeHref = (href: string) =>
  href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:");

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const segments = text.split(INLINE_PATTERN);
  segments.forEach((segment, index) => {
    const key = `inline-${index}`;
    if (segment.startsWith("**") && segment.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {segment.slice(2, -2)}
        </strong>,
      );
      return;
    }
    if (segment.startsWith("*") && segment.endsWith("*") && segment.length > 2) {
      nodes.push(<em key={key}>{segment.slice(1, -1)}</em>);
      return;
    }
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 2) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {segment.slice(1, -1)}
        </code>,
      );
      return;
    }
    const linkMatch = LINK_PATTERN.exec(segment);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (isSafeHref(href)) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {label}
          </a>,
        );
      } else {
        nodes.push(<React.Fragment key={key}>{label}</React.Fragment>);
      }
      return;
    }
    if (segment.length > 0) {
      nodes.push(<React.Fragment key={key}>{segment}</React.Fragment>);
    }
  });
  return nodes;
}

type ListItem = {
  text: string;
  task: "none" | "unchecked" | "checked";
};

const TASK_ITEM_PATTERN = /^[-*]\s+\[([ xX])\]\s+(.*)$/;
const UNORDERED_ITEM_PATTERN = /^[-*]\s+(.*)$/;
const ORDERED_ITEM_PATTERN = /^\d+[.)]\s+(.*)$/;
const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;

function parseListItem(line: string): ListItem | null {
  const taskMatch = TASK_ITEM_PATTERN.exec(line);
  if (taskMatch) {
    return {
      text: taskMatch[2],
      task: taskMatch[1] === " " ? "unchecked" : "checked",
    };
  }
  const itemMatch = UNORDERED_ITEM_PATTERN.exec(line);
  if (itemMatch) {
    return { text: itemMatch[1], task: "none" };
  }
  return null;
}

function renderListItems(items: ListItem[], keyPrefix: string) {
  return items.map((item, index) =>
    item.task === "none" ? (
      <li key={`${keyPrefix}-${index}`}>{renderInline(item.text)}</li>
    ) : (
      <li key={`${keyPrefix}-${index}`} className="flex list-none items-start gap-2 -ml-5">
        <input
          type="checkbox"
          checked={item.task === "checked"}
          readOnly
          tabIndex={-1}
          className="pointer-events-none mt-1 accent-primary"
        />
        <span className={cn(item.task === "checked" && "text-muted-foreground line-through")}>
          {renderInline(item.text)}
        </span>
      </li>
    ),
  );
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `block-${i}`;

    // Blank line
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push(
        <pre
          key={key}
          className="my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const headingMatch = HEADING_PATTERN.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2]);
      if (level === 1) {
        blocks.push(
          <h1 key={key} className="mt-6 mb-2 text-xl font-semibold tracking-tight first:mt-0">
            {text}
          </h1>,
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={key} className="mt-5 mb-2 text-lg font-semibold tracking-tight first:mt-0">
            {text}
          </h2>,
        );
      } else {
        blocks.push(
          <h3 key={key} className="mt-4 mb-1.5 font-semibold first:mt-0">
            {text}
          </h3>,
        );
      }
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      blocks.push(<hr key={key} className="my-4 border-border" />);
      i += 1;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={key}
          className="my-2 border-l-2 border-border pl-3 text-muted-foreground italic"
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Unordered / task list
    if (parseListItem(line) !== null) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const item = parseListItem(lines[i]);
        if (item === null) break;
        items.push(item);
        i += 1;
      }
      blocks.push(
        <ul key={key} className="my-2 list-disc space-y-1 pl-5">
          {renderListItems(items, key)}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (ORDERED_ITEM_PATTERN.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = ORDERED_ITEM_PATTERN.exec(lines[i]);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push(
        <ol key={key} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((item, index) => (
            <li key={`${key}-${index}`}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph: gather consecutive plain lines
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !HEADING_PATTERN.test(lines[i]) &&
      !lines[i].startsWith(">") &&
      parseListItem(lines[i]) === null &&
      !ORDERED_ITEM_PATTERN.test(lines[i]) &&
      !/^(-{3,}|\*{3,})\s*$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={key} className="my-2 leading-relaxed first:mt-0 last:mb-0">
        {renderInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return blocks;
}

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return <div className={cn("text-sm text-foreground", className)}>{renderMarkdown(content)}</div>;
}
