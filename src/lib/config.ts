const repository = "https://github.com/kyh/ai-notes";

export const siteConfig = {
  author: { name: "Kaiyu Hsu", url: "https://kyh.io" },
  creator: "@kaiyuhsu",
  description:
    "AI-native notes — capture, organize, and rewrite your notes in natural language. Forkable Next.js template.",
  email: "kai@kyh.io",
  name: "AI Notes",
  repository,
  routes: ["", "/about", "/contact", "/privacy"],
  sameAs: [repository, "https://kyh.io", "https://x.com/kaiyuhsu"],
  shortName: "AI Notes",
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://notes.kyh.io",
};
