import RetainerDetailsFeature from "@/features/protected/retainers/[id]/RetainerDetailsFeature";
import { checkDetailAccessOrRedirect } from "@/lib/checkDetailAccess";

interface RetainerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RetainerDetailPage({
  params,
}: RetainerDetailPageProps) {
  const { id } = await params;

  await checkDetailAccessOrRedirect({
    accessPath: `retainers/${encodeURIComponent(id)}/access`,
    listingPath: "/retainers",
    notFoundError: "retainer_not_found",
  });

  return <RetainerDetailsFeature retainerId={id} />;
}
