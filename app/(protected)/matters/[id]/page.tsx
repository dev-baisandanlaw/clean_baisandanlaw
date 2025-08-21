import MatterDetailsFeature from "@/features/protected/matters/id/MatterDetailsFeature";
import { use } from "react";

interface MatterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MatterDetailPage({ params }: MatterDetailPageProps) {
  const { id } = use(params);

  return <MatterDetailsFeature matterId={id} />;
}
