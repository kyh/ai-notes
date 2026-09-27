import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { siteConfig } from "../config";
import { buildHomeGraph, buildOrganization, serializeJsonLd } from "./structured-data";

describe("buildOrganization", () => {
  const organization = buildOrganization();

  test("carries identity and a contact point with email and type", () => {
    assert.equal(organization.name, siteConfig.name);
    assert.equal(organization.url, siteConfig.url);
    assert.deepEqual(organization.sameAs, siteConfig.sameAs);
    const [first] = organization.contactPoint;
    assert.equal(first?.email, siteConfig.email);
    assert.equal(first?.contactType, "customer support");
  });

  test("invents no postal address or phone", () => {
    assert.equal("address" in organization, false);
    assert.equal("telephone" in organization, false);
  });
});

describe("buildHomeGraph", () => {
  test("links website and application back to the organization", () => {
    const graph = buildHomeGraph()["@graph"];
    const types = graph.map((node) => node["@type"]);
    assert.deepEqual(types, ["Organization", "WebSite", "WebApplication"]);
    for (const node of graph.slice(1)) {
      assert.deepEqual(node.publisher, { "@id": `${siteConfig.url}/#organization` });
    }
  });
});

describe("serializeJsonLd", () => {
  test("escapes < so a value cannot close the script tag", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    assert.equal(serialized.includes("<"), false);
    assert.deepEqual(JSON.parse(serialized), { name: "</script><script>alert(1)</script>" });
  });
});
