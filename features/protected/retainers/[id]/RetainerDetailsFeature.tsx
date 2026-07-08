"use client";

import RTabDocuments from "@/components/retainers/RTabDocuments";
import RTabOverview from "@/components/retainers/RTabOverview";
import { useUser } from "@clerk/nextjs";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import { IconCategory, IconFolder } from "@tabler/icons-react";
import { useGetSingleRetainerQuery } from "@/store/services/retainerService";

interface RetainerDetailsFeatureProps {
  retainerId: string | null | undefined;
}

const tabs = [
  { value: "overview", label: "Overview", icon: IconCategory },
  { value: "documents", label: "Documents", icon: IconFolder },
];

export default function RetainerDetailsFeature({
  retainerId,
}: RetainerDetailsFeatureProps) {
  const { isLoaded, isSignedIn } = useUser();

  const { data: retainerDetails, isLoading: isFetchingRetainerDetails } =
    useGetSingleRetainerQuery(
      {
        id: retainerId!,
        options: ["documents", "notes"],
      },
      { skip: !retainerId || !isLoaded || !isSignedIn },
    );

  return (
    <Tabs defaultValue="documents" pos="relative" variant="outline">
      <LoadingOverlay visible={isFetchingRetainerDetails} />

      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab
            value={tab.value}
            key={tab.value}
            leftSection={<tab.icon />}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      <ScrollArea h="calc(100vh - 170px)" mt="xs" offsetScrollbars>
        <Tabs.Panel value="overview">
          {!isFetchingRetainerDetails && retainerDetails && (
            <RTabOverview retainerData={retainerDetails} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="documents">
          {!isFetchingRetainerDetails && retainerDetails && (
            <RTabDocuments retainerData={retainerDetails} />
          )}
        </Tabs.Panel>
      </ScrollArea>
    </Tabs>
  );
}
