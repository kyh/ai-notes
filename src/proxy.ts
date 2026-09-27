import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "@/lib/agent/accept";

/**
 * Markdown content negotiation to the acceptmarkdown.com contract: one URL,
 * two representations. Server Components always render HTML, so the proxy is
 * the only place to divert a Markdown-preferring request before the page runs.
 * <https://acceptmarkdown.com/recipes/nextjs>
 */

const RSC_MEDIA_TYPE = "text/x-component";

const applyVary = (response: NextResponse): NextResponse => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));
  return response;
};

/** React's own transport (Server Actions, flight fetches) is not a page representation. */
const isFlightRequest = (request: NextRequest) =>
  (request.headers.get("accept") ?? "").toLowerCase().includes(RSC_MEDIA_TYPE) ||
  request.headers.has("next-action");

export const proxy = (request: NextRequest) => {
  if (isFlightRequest(request)) {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept");
  const chosen = negotiateMediaType(accept);

  if (chosen === "text/markdown") {
    const url = request.nextUrl.clone();
    const { pathname } = request.nextUrl;
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
    return applyVary(NextResponse.rewrite(url));
  }

  if (chosen === null) {
    return new Response(notAcceptableBody(accept), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
      status: 406,
    });
  }

  return applyVary(NextResponse.next());
};

/**
 * Only an `Accept` naming markdown invokes the proxy, so browsers never pay for
 * it. Next and Vercel each compile `has` to their own anchored, case-sensitive
 * regex, hence the per-character case class instead of an inline flag. eve's
 * agent routes and single-representation files are excluded.
 */
export const config = {
  matcher: [
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|eve/|_eve_internal/|favicon/|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.jpg$).*)",
    },
  ],
};
