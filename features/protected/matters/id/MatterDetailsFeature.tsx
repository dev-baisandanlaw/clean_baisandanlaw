"use client";

import TabDocuments from "@/components/matter/TabDocuments";
import TabOverview from "@/components/matter/TabOverview";
import TabSchedules from "@/components/matter/TabSchedules";
import TabTasks from "@/components/matter/TabTasks";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import {
  IconCategory,
  IconChecklist,
  IconFolder,
  IconCalendarWeek,
} from "@tabler/icons-react";
import { createContext } from "react";
import { useUser } from "@clerk/nextjs";
import { useGetSingleMatterQuery } from "@/store/services/matterService";

interface MatterDetailsFeatureProps {
  matterId: string | null | undefined;
}

const tabs = [
  { value: "overview", label: "Overview", icon: IconCategory },
  { value: "documents", label: "Documents", icon: IconFolder },
  { value: "tasks", label: "Tasks", icon: IconChecklist },
  { value: "schedules", label: "Schedules", icon: IconCalendarWeek },
];

export const DataChangedContext = createContext(false);

export default function MatterDetailsFeature({
  matterId,
}: MatterDetailsFeatureProps) {
  const { isLoaded } = useUser();

  const { data: matterDetails, isLoading: isFetchingMatterDetails } =
    useGetSingleMatterQuery(
      { id: matterId!, options: ["documents", "tasks", "schedules", "notes"] },
      { skip: !matterId || !isLoaded },
    );

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
            <TabOverview matterData={matterDetails} />
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
          <Tabs.Panel value="schedules">
            <TabSchedules matterData={matterDetails} />
          </Tabs.Panel>
        )}
      </ScrollArea>
    </Tabs>
  );
}
