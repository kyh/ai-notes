import * as React from "react";

import { cn } from "cn";

/**
 * Tiny hand-rolled markdown renderer for a safe subset:
 * headings (#..###), paragraphs, bold, italic, inline code, links,
 * fenced code blocks, blockquotes, hr, ordered/unordered lists, and
 * task-list checkboxes. Renders React nodes directly — no HTML strings,
 * no dangerouslySetInnerHTML. Keys are positional on purpose: the whole
 * document is re-parsed on every render, so tokens have no identity outside
 * their index.
 */

const INLINE_PATTERN = /(?<token>\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^()\s]+\))/gu;

const LINK_PATTERN = /^\[(?<label>[^\]]+)\]\((?<href>[^()\s]+)\)$/u;

const isSafeHref = (href: string) =>
  href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:");

const renderInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const segments = text.split(INLINE_PATTERN);
  for (const [index, segment] of segments.entries()) {
    const key = `inline-${index}`;
    if (segment.startsWith("**") && segment.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {segment.slice(2, -2)}
        </strong>,
      );
      continue;
    }
    if (segment.startsWith("*") && segment.endsWith("*") && segment.length > 2) {
      nodes.push(<em key={key}>{segment.slice(1, -1)}</em>);
      continue;
    }
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 2) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {segment.slice(1, -1)}
        </code>,
      );
      continue;
    }
    const linkMatch = LINK_PATTERN.exec(segment)?.groups;
    if (linkMatch) {
      const { label, href } = linkMatch;
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
      continue;
    }
    if (segment.length > 0) {
      nodes.push(<React.Fragment key={key}>{segment}</React.Fragment>);
    }
  }
  return nodes;
};

interface ListItem {
  text: string;
  task: "none" | "unchecked" | "checked";
}

const TASK_ITEM_PATTERN = /^[-*]\s+\[(?<mark>[ xX])\]\s+(?<text>.*)$/u;
const UNORDERED_ITEM_PATTERN = /^[-*]\s+(?<text>.*)$/u;
const ORDERED_ITEM_PATTERN = /^\d+[.)]\s+(?<text>.*)$/u;
const HEADING_PATTERN = /^(?<hashes>#{1,3})\s+(?<text>.*)$/u;
const RULE_PATTERN = /^(?:-{3,}|\*{3,})\s*$/u;

const isFence = (line: string) => line.trimStart().startsWith("```");
const isRule = (line: string) => RULE_PATTERN.test(line.trim());

const parseListItem = (line: string): ListItem | null => {
  const taskMatch = TASK_ITEM_PATTERN.exec(line)?.groups;
  if (taskMatch) {
    return {
      task: taskMatch.mark === " " ? "unchecked" : "checked",
      text: taskMatch.text,
    };
  }
  const itemMatch = UNORDERED_ITEM_PATTERN.exec(line)?.groups;
  if (itemMatch) {
    return { task: "none", text: itemMatch.text };
  }
  return null;
};

const startsBlock = (line: string) =>
  isFence(line) ||
  HEADING_PATTERN.test(line) ||
  line.startsWith(">") ||
  parseListItem(line) !== null ||
  ORDERED_ITEM_PATTERN.test(line) ||
  isRule(line);

const renderListItems = (items: ListItem[], keyPrefix: string) =>
  items.map((item, index) =>
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

/** One rendered block plus the index of the first line after it. */
interface Block {
  node: React.ReactNode;
  next: number;
}

const readFencedCode = (lines: string[], start: number, key: string): Block => {
  const codeLines: string[] = [];
  let i = start + 1;
  while (i < lines.length && !isFence(lines[i])) {
    codeLines.push(lines[i]);
    i += 1;
  }
  return {
    next: i + 1,
    node: (
      <pre
        key={key}
        className="my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    ),
  };
};

const renderHeading = (level: number, text: React.ReactNode[], key: string) => {
  if (level === 1) {
    return (
      <h1 key={key} className="mt-6 mb-2 text-xl font-semibold tracking-tight first:mt-0">
        {text}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 key={key} className="mt-5 mb-2 text-lg font-semibold tracking-tight first:mt-0">
        {text}
      </h2>
    );
  }
  return (
    <h3 key={key} className="mt-4 mb-1.5 font-semibold first:mt-0">
      {text}
    </h3>
  );
};

const readBlockquote = (lines: string[], start: number, key: string): Block => {
  const quoteLines: string[] = [];
  let i = start;
  while (i < lines.length && lines[i].startsWith(">")) {
    quoteLines.push(lines[i].replace(/^>\s?/u, ""));
    i += 1;
  }
  return {
    next: i,
    node: (
      <blockquote
        key={key}
        className="my-2 border-l-2 border-border pl-3 text-muted-foreground italic"
      >
        {renderInline(quoteLines.join(" "))}
      </blockquote>
    ),
  };
};

const readUnorderedList = (lines: string[], start: number, key: string): Block => {
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const item = parseListItem(lines[i]);
    if (item === null) {
      break;
    }
    items.push(item);
    i += 1;
  }
  return {
    next: i,
    node: (
      <ul key={key} className="my-2 list-disc space-y-1 pl-5">
        {renderListItems(items, key)}
      </ul>
    ),
  };
};

const readOrderedList = (lines: string[], start: number, key: string): Block => {
  const items: string[] = [];
  let i = start;
  while (i < lines.length) {
    const match = ORDERED_ITEM_PATTERN.exec(lines[i])?.groups;
    if (!match) {
      break;
    }
    items.push(match.text);
    i += 1;
  }
  return {
    next: i,
    node: (
      <ol key={key} className="my-2 list-decimal space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item)}</li>
        ))}
      </ol>
    ),
  };
};

const readParagraph = (lines: string[], start: number, key: string): Block => {
  const paragraphLines: string[] = [];
  let i = start;
  while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines[i])) {
    paragraphLines.push(lines[i]);
    i += 1;
  }
  return {
    next: i,
    node: (
      <p key={key} className="my-2 leading-relaxed first:mt-0 last:mb-0">
        {renderInline(paragraphLines.join(" "))}
      </p>
    ),
  };
};

const readBlock = (lines: string[], start: number): Block => {
  const line = lines[start];
  const key = `block-${start}`;
  if (isFence(line)) {
    return readFencedCode(lines, start, key);
  }
  const heading = HEADING_PATTERN.exec(line)?.groups;
  if (heading) {
    return {
      next: start + 1,
      node: renderHeading(heading.hashes.length, renderInline(heading.text), key),
    };
  }
  if (isRule(line)) {
    return { next: start + 1, node: <hr key={key} className="my-4 border-border" /> };
  }
  if (line.startsWith(">")) {
    return readBlockquote(lines, start, key);
  }
  if (parseListItem(line) !== null) {
    return readUnorderedList(lines, start, key);
  }
  if (ORDERED_ITEM_PATTERN.test(line)) {
    return readOrderedList(lines, start, key);
  }
  return readParagraph(lines, start, key);
};

const renderMarkdown = (content: string): React.ReactNode[] => {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }
    const block = readBlock(lines, i);
    blocks.push(block.node);
    i = block.next;
  }
  return blocks;
};

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview = ({ content, className }: MarkdownPreviewProps) => (
  <div className={cn("text-sm text-foreground", className)}>{renderMarkdown(content)}</div>
);
