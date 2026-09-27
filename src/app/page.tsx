import type { Metadata } from "next";

import { NotesApp } from "@/components/notes/notes-app";
import { JsonLd } from "@/components/site/json-ld";
import { SiteIntro } from "@/components/site/site-intro";
import { buildHomeGraph } from "@/lib/agent/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const Page = () => (
  <>
    <NotesApp />
    <SiteIntro />
    <JsonLd node={buildHomeGraph()} />
  </>
);

export default Page;
