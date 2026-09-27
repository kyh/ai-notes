import { ProsePageView } from "@/components/site/prose-page-view";
import { prosePageMetadata } from "@/lib/agent/page-metadata";
import { aboutPage } from "@/lib/agent/site-content";

export const metadata = prosePageMetadata(aboutPage);

const Page = () => <ProsePageView page={aboutPage} />;

export default Page;
