import { ProsePageView } from "@/components/site/prose-page-view";
import { prosePageMetadata } from "@/lib/agent/page-metadata";
import { privacyPage } from "@/lib/agent/site-content";

export const metadata = prosePageMetadata(privacyPage);

const Page = () => <ProsePageView page={privacyPage} />;

export default Page;
