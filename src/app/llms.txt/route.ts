import { renderLlmsTxt } from "@/lib/agent/markdown";

export const dynamic = "force-static";

export const GET = () =>
  new Response(renderLlmsTxt(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
