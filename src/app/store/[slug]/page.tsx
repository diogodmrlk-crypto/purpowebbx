import { StorePageContent } from "@/app/store/store-page-content";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorePageContent slug={slug} />;
}
