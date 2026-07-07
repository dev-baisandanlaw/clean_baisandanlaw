import MatterDetailsFeature from "@/features/protected/matters/id/MatterDetailsFeature";
import { checkDetailAccessOrRedirect } from "@/lib/checkDetailAccess";

interface MatterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatterDetailPage({
  params,
}: MatterDetailPageProps) {
  const { id } = await params;

  await checkDetailAccessOrRedirect({
    accessPath: `matters/${encodeURIComponent(id)}/access`,
    listingPath: "/matters",
    notFoundError: "matter_not_found",
  });

  return <MatterDetailsFeature matterId={id} />;
}
