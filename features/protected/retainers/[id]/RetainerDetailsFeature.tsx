"use client";

import RTabDocuments from "@/components/retainers/RTabDocuments";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Retainer } from "@/types/retainer";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import { IconCategory, IconFolder, IconNotes } from "@tabler/icons-react";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface RetainerDetailsFeatureProps {
  retainerId: string | null | undefined;
}

const tabs = [
  { value: "overview", label: "Overview", icon: IconCategory },
  { value: "documents", label: "Documents", icon: IconFolder },
  { value: "notes", label: "Notes", icon: IconNotes },
];

export default function RetainerDetailsFeature({
  retainerId,
}: RetainerDetailsFeatureProps) {
  const [dataChanged, setDataChanged] = useState(false);

  const [retainerData, setRetainerData] = useState<Retainer | null>(null);

  const [isFetching, setIsFetching] = useState(false);

  const fetchRetainerDetails = useCallback(async () => {
    if (!retainerId) {
      setRetainerData(null);
      return;
    }

    setIsFetching(true);
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.RETAINERS, retainerId));
      if (!snap.exists()) {
        setRetainerData(null);
        return;
      }

      const r = { ...(snap.data() as Retainer), id: snap.id };

      setRetainerData(r);
    } catch {
      toast.error("Failed to fetch retainer details");
    } finally {
      setIsFetching(false);
    }
  }, [retainerId]);

  useEffect(() => {
    fetchRetainerDetails();
  }, [fetchRetainerDetails, dataChanged]);

  return (
    <Tabs defaultValue="documents" pos="relative" variant="outline">
      <LoadingOverlay visible={isFetching} />

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
        <Tabs.Panel value="overview">
          <div>Overview</div>
        </Tabs.Panel>
        <Tabs.Panel value="documents">
          {!isFetching && retainerData && (
            <RTabDocuments
              retainerData={retainerData}
              setDataChanged={setDataChanged}
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="notes">
          <div>Notes</div>
          {/* <TabNotes retainerData={retainerData} /> */}
        </Tabs.Panel>
      </ScrollArea>
    </Tabs>
  );
}
