import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { siteConfig } from "../config";
import {
  renderHomeMarkdown,
  renderLlmsTxt,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "./markdown";
import { findProsePage, prosePages } from "./site-content";

const countOccurrences = (haystack: string, needle: RegExp): number =>
  haystack.match(needle)?.length ?? 0;

describe("renderLlmsTxt", () => {
  const llms = renderLlmsTxt();

  test("follows the llmstxt.org shape: one H1 first, then a blockquote summary", () => {
    const [h1, blank, summary] = llms.split("\n");
    assert.equal(h1, `# ${siteConfig.name}`);
    assert.equal(blank, "");
    assert.ok(summary?.startsWith("> "), "second block should be the blockquote summary");
    assert.equal(countOccurrences(llms, /^# /gmu), 1);
  });

  test("names when to use the product before any H2", () => {
    const whenToUse = llms.indexOf(`**When to use ${siteConfig.name}:**`);
    assert.ok(whenToUse > 0, "should contain the when-to-use block");
    assert.ok(whenToUse < llms.indexOf("\n## "), "when-to-use belongs in the pre-H2 prose");
  });

  test("links every trust page with an absolute URL", () => {
    for (const page of prosePages) {
      assert.ok(llms.includes(`(${siteConfig.url}${page.path})`), `should link ${page.path}`);
    }
  });

  test("ends with exactly one newline", () => {
    assert.ok(llms.endsWith("\n") && !llms.endsWith("\n\n"));
  });
});

describe("renderProsePageMarkdown", () => {
  test("renders every trust page with substantial content", () => {
    for (const page of prosePages) {
      const markdown = renderProsePageMarkdown(page);
      assert.ok(markdown.startsWith(`# ${page.heading}\n`), `${page.path} should open with H1`);
      assert.ok(markdown.length >= 500, `${page.path} should carry at least 500 chars`);
    }
  });

  test("finds pages by path and nothing else", () => {
    assert.equal(findProsePage("/privacy")?.path, "/privacy");
    assert.equal(findProsePage("/nope"), null);
  });
});

describe("renderHomeMarkdown", () => {
  test("opens with the product name and links the trust pages", () => {
    const home = renderHomeMarkdown();
    assert.ok(home.startsWith(`# ${siteConfig.name}\n`));
    assert.ok(home.includes(`${siteConfig.url}/about`));
  });
});

describe("renderNotFoundMarkdown", () => {
  test("echoes the path and points at recovery surfaces", () => {
    const body = renderNotFoundMarkdown("/missing");
    assert.ok(body.includes("`/missing`"));
    assert.ok(body.includes(`${siteConfig.url}/llms.txt`));
    assert.ok(body.includes(`${siteConfig.url}/sitemap.xml`));
  });
});
