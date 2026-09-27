import { siteConfig } from "../config";

/**
 * Every word the site says about itself, authored once and rendered twice: as
 * JSX for browsers and as Markdown for agents (`/llms.txt`, and any page
 * requested with `Accept: text/markdown`). One source keeps the two from
 * drifting.
 */

export interface ProseLink {
  label: string;
  href?: string;
  text?: string;
}

export type ProseBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: ProseLink[] };

export interface ProsePage {
  path: string;
  title: string;
  heading: string;
  description: string;
  blocks: ProseBlock[];
}

export const siteSummary = `${siteConfig.name} is a local-first notes app with an AI assistant that summarizes, tags, rewrites, and reorganizes your notes in plain language. It is also a free, open-source Next.js template you can fork.`;

export const introParagraphs: string[] = [
  `${siteConfig.name} is a two-pane markdown notes app — a searchable, taggable list on one side and an editor with live preview on the other — plus an assistant sidebar you talk to in natural language. Ask it to summarize your meeting notes, tag everything, turn a week plan into a checklist, or tighten a blog draft, and it edits the notes in place while you watch.`,
  "Notes live in your browser's local storage. There is no account, no sign-up, and no database: the app opens with a handful of example notes so the assistant has something to work with, and everything you write stays on your device until you send a message to the assistant.",
  `The assistant runs on eve, Vercel's agent framework, and calls the model through the Vercel AI Gateway. On the hosted site you bring your own AI Gateway key; the notes editor works without one. The whole app is MIT licensed at ${siteConfig.repository}, meant to be forked as a starting point for agent-native apps.`,
];

export const whenToUse: ProseLink[] = [
  {
    label: "Someone wants a quick scratchpad with an AI editor",
    text: "point them at the hosted app for capturing notes and having them summarized, tagged, rewritten, or turned into checklists without creating an account",
  },
  {
    label: "A developer is building an agent-native app on Next.js",
    text: "the source is a working reference for eve's `withEve` integration, typed tools that mutate client state, streaming tool results into the UI, and a bring-your-own-key model resolver",
  },
  {
    label: "Someone needs a forkable notes starter",
    text: "clone the repository, run `pnpm install && pnpm dev`, and the app runs locally with seeded notes and no database",
  },
  {
    label: "Not a fit",
    text: "it has no sync, sharing, collaboration, or account system, and no public programmatic interface — notes exist only in the browser that wrote them",
  },
];

export const aboutPage: ProsePage = {
  blocks: [
    ...introParagraphs.map((text): ProseBlock => ({ kind: "paragraph", text })),
    { kind: "heading", text: "How it works" },
    {
      kind: "paragraph",
      text: "Each message you send carries a snapshot of your notes: a short snippet of every note plus the full text of the one you have open. The agent answers with typed tool calls — create, update, or delete a note — and the app applies each result to your local notes as it streams in. The server itself keeps no copy of your notes.",
    },
    {
      kind: "paragraph",
      text: `It is built and maintained by ${siteConfig.author.name} as one of a set of small, forkable AI-native app templates. The stack is Next.js, React, Tailwind CSS, Base UI, zustand, and eve with the AI SDK.`,
    },
    {
      items: [
        { href: siteConfig.repository, label: "Source code", text: "MIT licensed, on GitHub" },
        { href: "/", label: "Open the app", text: "no sign-up needed" },
        { href: "/contact", label: "Contact", text: "email and GitHub issues" },
      ],
      kind: "list",
    },
  ],
  description: `What ${siteConfig.name} is, how its assistant edits your notes, and how to fork it.`,
  heading: `About ${siteConfig.name}`,
  path: "/about",
  title: "About",
};

export const contactPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: `${siteConfig.name} is built and maintained by ${siteConfig.author.name}. There is no support desk or contact form — email and GitHub are the two channels, and both reach the same person.`,
    },
    {
      kind: "paragraph",
      text: "Email is best for anything private: questions about the hosted app, privacy requests, licensing, or feedback you would rather not post publicly. Expect a reply within a few business days.",
    },
    {
      kind: "paragraph",
      text: "For anything about the code — a bug in the notes editor, an assistant turn that went wrong, trouble running the template locally, or an idea for a feature — open a GitHub issue so the next person who hits the same thing can find the answer.",
    },
    { kind: "heading", text: "Channels" },
    {
      items: [
        {
          href: `mailto:${siteConfig.email}`,
          label: siteConfig.email,
          text: "general questions, privacy requests, licensing",
        },
        {
          href: `${siteConfig.repository}/issues`,
          label: "GitHub issues",
          text: "bugs and feature requests",
        },
        { href: siteConfig.author.url, label: "kyh.io", text: "other projects by the same author" },
      ],
      kind: "list",
    },
  ],
  description: `How to reach the maker of ${siteConfig.name} — email and GitHub issues.`,
  heading: `Contact ${siteConfig.name}`,
  path: "/contact",
  title: "Contact",
};

export const privacyPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: `${siteConfig.name} has no accounts, no database, and no advertising or third-party trackers. Nothing is sold or shared with data brokers.`,
    },
    { kind: "heading", text: "Stored in your browser" },
    {
      items: [
        {
          label: "Your notes",
          text: "kept in local storage on your device. The server has no copy; clearing site data deletes them",
        },
        {
          label: "Your AI Gateway key",
          text: "if you add one, it is kept in local storage and can be removed from the key dialog at any time",
        },
        { label: "Theme preference", text: "your light or dark choice, in local storage" },
      ],
      kind: "list",
    },
    { kind: "heading", text: "Sent when you use the assistant" },
    {
      kind: "paragraph",
      text: "Nothing leaves your device until you send the assistant a message. Then the request carries your message, a short snippet of every note, the full text of the note you have open, your time zone, and your AI Gateway key. The agent runtime on Vercel keeps the conversation's session state and forwards the prompt through the Vercel AI Gateway to the model provider (OpenAI). Your key is used only to bill those model calls to your own gateway account.",
    },
    { kind: "heading", text: "Collected automatically" },
    {
      items: [
        {
          href: "https://vercel.com/docs/analytics/privacy-policy",
          label: "Vercel Web Analytics",
          text: "aggregate, cookieless page-view counts",
        },
        {
          href: "https://vercel.com/docs/speed-insights/privacy-policy",
          label: "Vercel Speed Insights",
          text: "anonymous page-performance metrics",
        },
        {
          label: "Server logs",
          text: "Vercel keeps short-lived request logs, including IP address and user agent",
        },
      ],
      kind: "list",
    },
    { kind: "heading", text: "Processors" },
    {
      items: [
        {
          href: "https://vercel.com/legal/privacy-policy",
          label: "Vercel",
          text: "hosting, the agent runtime, the AI Gateway, analytics",
        },
        {
          href: "https://openai.com/policies/privacy-policy",
          label: "OpenAI",
          text: "the model behind the assistant, reached through the AI Gateway",
        },
      ],
      kind: "list",
    },
    {
      kind: "paragraph",
      text: `Questions or requests go to ${siteConfig.email}.`,
    },
  ],
  description: `What ${siteConfig.name} stores, what it sends when you use the assistant, and who processes it.`,
  heading: "Privacy",
  path: "/privacy",
  title: "Privacy",
};

export const prosePages: ProsePage[] = [aboutPage, contactPage, privacyPage];

export const findProsePage = (path: string): ProsePage | null =>
  prosePages.find((page) => page.path === path) ?? null;
