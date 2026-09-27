import { ProsePageView } from "@/components/site/prose-page-view";
import { prosePageMetadata } from "@/lib/agent/page-metadata";
import { contactPage } from "@/lib/agent/site-content";

export const metadata = prosePageMetadata(contactPage);

const Page = () => <ProsePageView page={contactPage} />;

export default Page;
