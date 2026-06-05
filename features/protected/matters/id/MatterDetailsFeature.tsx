"use client";

import TabDocuments from "@/components/matter/TabDocuments";
import TabOverview from "@/components/matter/TabOverview";
import TabSchedules from "@/components/matter/TabSchedules";
import TabTasks from "@/components/matter/TabTasks";
import { Matter as MatterCase } from "@/types/case";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import {
  IconCategory,
  IconChecklist,
  IconFolder,
  IconCalendarWeek,
} from "@tabler/icons-react";
import { createContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useGetSingleMatterQuery } from "@/store/services/matterService";

interface MatterDetailsFeatureProps {
  matterId: string | null | undefined;
}

const tabs = [
  { value: "overview", label: "Overview", icon: IconCategory },
  { value: "documents", label: "Documents", icon: IconFolder },
  { value: "tasks", label: "Tasks", icon: IconChecklist },
  { value: "schedule", label: "Schedule", icon: IconCalendarWeek },
];

export const DataChangedContext = createContext(false);

export default function MatterDetailsFeature({
  matterId,
}: MatterDetailsFeatureProps) {
  const { isLoaded } = useUser();

  const {
    data: matterDetails,
    isLoading: isFetchingMatterDetails,
    refetch: refetchMatterDetails,
  } = useGetSingleMatterQuery(
    { id: matterId!, options: ["documents", "tasks"] },
    { skip: !matterId || !isLoaded },
  );

  const [dataChanged, setDataChanged] = useState(false);

  // Refetch matter details when dataChanged toggles (after edits in child components)
  useEffect(() => {
    if (matterId && isLoaded) {
      refetchMatterDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataChanged]);

  return (
    <Tabs
      defaultValue="overview"
      variant="outline"
      pos="relative"
      styles={{
        list: {
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollbarWidth: "none",
        },
      }}
    >
      <LoadingOverlay visible={isFetchingMatterDetails} />

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

      <ScrollArea h="calc(100vh - 170px)" mt="xs">
        {!isFetchingMatterDetails && matterDetails && (
          <Tabs.Panel value="overview">
            <TabOverview
              matterData={matterDetails}
              setDataChanged={setDataChanged}
            />
          </Tabs.Panel>
        )}

        {!isFetchingMatterDetails && matterDetails && (
          <Tabs.Panel value="documents">
            <TabDocuments matterData={matterDetails} />
          </Tabs.Panel>
        )}

        {!isFetchingMatterDetails && matterDetails && (
          <Tabs.Panel value="tasks">
            <TabTasks matterData={matterDetails} />
          </Tabs.Panel>
        )}

        {!isFetchingMatterDetails && matterDetails && (
          <Tabs.Panel value="schedule">
            <TabSchedules
              matterData={matterDetails as unknown as MatterCase}
              setDataChanged={setDataChanged}
            />
          </Tabs.Panel>
        )}
      </ScrollArea>
    </Tabs>
  );
}
