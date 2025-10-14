import RetainerDetailsFeature from "@/features/protected/retainers/[id]/RetainerDetailsFeature";
import { use } from "react";

interface RetainerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RetainerDetailPage({
  params,
}: RetainerDetailPageProps) {
  const { id } = use(params);

  return <RetainerDetailsFeature retainerId={id} />;
}
