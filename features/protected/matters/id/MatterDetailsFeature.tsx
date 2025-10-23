"use client";

import TabDocuments from "@/components/matter/TabDocuments";
import TabOverview from "@/components/matter/TabOverview";
import TabSchedules from "@/components/matter/TabSchedules";
import TabTasks from "@/components/matter/TabTasks";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import { MatterUpdateDocument } from "@/types/matter-updates";
import { Attorney, Client } from "@/types/user";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import {
  IconCategory,
  IconChecklist,
  IconFolder,
  IconCalendarWeek,
  // IconMessage,
} from "@tabler/icons-react";
import axios from "axios";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { createContext, useCallback, useEffect, useState } from "react";

interface MatterDetailsFeatureProps {
  matterId: string | null | undefined;
}

const tabs = [
  { value: "overview", label: "Overview", icon: IconCategory },
  { value: "documents", label: "Documents", icon: IconFolder },
  { value: "tasks", label: "Tasks", icon: IconChecklist },
  { value: "schedule", label: "Schedule", icon: IconCalendarWeek },
  // { value: "channel", label: "Channel", icon: IconMessage },
];

export const DataChangedContext = createContext(false);

export default function MatterDetailsFeature({
  matterId,
}: MatterDetailsFeatureProps) {
  const [matterData, setMatterData] = useState<Matter | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [attorneyData, setAttorneyData] = useState<Attorney | null>(null);
  const [matterUpdates, setMatterUpdates] =
    useState<MatterUpdateDocument | null>(null);

  const [isMatterLoading, setIsMatterLoading] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [isAttorneyLoading, setIsAttorneyLoading] = useState(false);

  //context
  const [dataChanged, setDataChanged] = useState(false);

  const fetchClientDetails = useCallback(async (clientId: string) => {
    try {
      setIsClientLoading(true);
      const { data } = await axios.get(
        "/api/clerk/organization/fetch-single-user",
        { params: { user_id: clientId } }
      );
      setClientData(data[0]);
    } catch (err) {
      console.error("fetchClientDetails error:", err);
      setClientData(null);
    } finally {
      setIsClientLoading(false);
    }
  }, []);

  const fetchAttorneyDetails = useCallback(async (attorneyId: string) => {
    try {
      setIsAttorneyLoading(true);
      const { data } = await axios.get(
        "/api/clerk/organization/fetch-single-user",
        { params: { user_id: attorneyId } }
      );
      setAttorneyData(data[0]);
    } catch (err) {
      console.error("fetchAttorneyDetails error:", err);
      setAttorneyData(null);
    } finally {
      setIsAttorneyLoading(false);
    }
  }, []);

  const fetchMatterDetails = useCallback(async () => {
    if (!matterId) {
      setMatterData(null);
      setClientData(null);
      setAttorneyData(null);
      return;
    }

    setIsMatterLoading(true);
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.CASES, matterId));
      if (!snap.exists()) {
        setMatterData(null);
        setClientData(null);
        setAttorneyData(null);
        return;
      }

      const m = { ...(snap.data() as Matter), id: snap.id };

      setMatterData(m);

      if (m.clientData?.id) {
        fetchClientDetails(m.clientData.id);
      } else {
        setClientData(null);
      }

      if (m.leadAttorney?.id) {
        fetchAttorneyDetails(m.leadAttorney.id);
      } else {
        setAttorneyData(null);
      }
    } catch (err) {
      console.error("fetchMatterDetails error:", err);
    } finally {
      setIsMatterLoading(false);
    }
  }, [matterId, fetchClientDetails, fetchAttorneyDetails]);

  useEffect(() => {
    fetchMatterDetails();
  }, [fetchMatterDetails, dataChanged]);

  useEffect(() => {
    if (!matterId) return;

    const ref = collection(db, COLLECTIONS.MATTER_UPDATES);
    const q = query(ref, where("id", "==", matterId));

    const unsub = onSnapshot(q, (snapshot) => {
      const results: MatterUpdateDocument[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as MatterUpdateDocument[];

      setMatterUpdates(results[0]);
    });

    return () => unsub();
  }, [matterId]);

  return (
    <Tabs defaultValue="overview" variant="outline" pos="relative">
      <LoadingOverlay
        visible={isMatterLoading || isClientLoading || isAttorneyLoading}
      />

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
        {!isMatterLoading &&
          !isClientLoading &&
          !isAttorneyLoading &&
          matterData &&
          clientData &&
          attorneyData &&
          matterUpdates && (
            <Tabs.Panel value="overview">
              <TabOverview
                matterData={matterData}
                clientData={clientData}
                attorneyData={attorneyData}
                matterUpdates={matterUpdates}
                setDataChanged={setDataChanged}
              />
            </Tabs.Panel>
          )}

        {!isMatterLoading && matterData && (
          <Tabs.Panel value="documents">
            <TabDocuments
              matterData={matterData}
              setDataChanged={setDataChanged}
            />
          </Tabs.Panel>
        )}

        {!isMatterLoading && matterData && (
          <Tabs.Panel value="tasks">
            <TabTasks matterData={matterData} />
          </Tabs.Panel>
        )}

        {!isMatterLoading && matterData && (
          <Tabs.Panel value="schedule">
            <TabSchedules
              matterData={matterData}
              setDataChanged={setDataChanged}
            />
          </Tabs.Panel>
        )}
      </ScrollArea>
    </Tabs>
  );
}
