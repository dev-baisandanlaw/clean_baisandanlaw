"use client";

import RTabDocuments from "@/components/retainers/RTabDocuments";
import RTabOverview from "@/components/retainers/RTabOverview";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Retainer } from "@/types/retainer";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import { LoadingOverlay, ScrollArea, Tabs } from "@mantine/core";
import { IconCategory, IconFolder } from "@tabler/icons-react";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import dayjs from "dayjs";

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
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [dataChanged, setDataChanged] = useState(false);

  const [retainerData, setRetainerData] = useState<Retainer | null>(null);

  const [isFetching, setIsFetching] = useState(false);

  const showNotification = useCallback((title: string, message: string) => {
    appNotifications.clean();
    appNotifications.cleanQueue();
    appNotifications.error({
      title,
      message,
    });
  }, []);

  const fetchRetainerDetails = async () => {
    if (!retainerId) {
      setRetainerData(null);
      showNotification(
        "Retainer not found",
        "The retainer could not be found. Please try again."
      );
      router.push("/retainers");
      return;
    }

    if (
      user?.unsafeMetadata?.role === "client" &&
      // @ts-expect-error - user is a client
      (!user?.unsafeMetadata?.subscription?.subscribedEndDate ||
        dayjs().isAfter(
          // @ts-expect-error - user is a client
          dayjs(user?.unsafeMetadata?.subscription?.subscribedEndDate).endOf(
            "day"
          )
        ))
    ) {
      showNotification(
        "Subscription Required",
        "You need to subscribe to a plan to access this feature."
      );
      router.push("/appointments");
      return;
    }

    setIsFetching(true);
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.RETAINERS, retainerId));
      if (!snap.exists()) {
        setRetainerData(null);

        showNotification(
          "Retainer not found",
          "The retainer could not be found. Please try again."
        );
        router.push("/retainers");

        return;
      }

      if (
        user?.unsafeMetadata?.role === "client" &&
        snap.data()?.contactPerson?.email !==
          user?.emailAddresses[0].emailAddress
      ) {
        showNotification(
          "Unauthorized",
          "You are not authorized to access this retainer."
        );
        router.push("/retainers");
        return;
      }

      const r = { ...(snap.data() as Retainer), id: snap.id };

      setRetainerData(r);
    } catch {
      appNotifications.error({
        title: "Failed to fetch retainer details",
        message: "The retainer details could not be fetched. Please try again.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!retainerId || !isLoaded) return;
    fetchRetainerDetails();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retainerId, isLoaded, dataChanged]);

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
          {!isFetching && retainerData && (
            <RTabOverview
              retainerData={retainerData}
              setDataChanged={setDataChanged}
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="documents">
          {!isFetching && retainerData && (
            <RTabDocuments
              retainerData={retainerData}
              setDataChanged={setDataChanged}
            />
          )}
        </Tabs.Panel>
      </ScrollArea>
    </Tabs>
  );
}
