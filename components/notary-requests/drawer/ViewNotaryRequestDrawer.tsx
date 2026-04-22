import DetailField from "@/components/Common/DetailField";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus, getNotaryStatusColor } from "@/utils/getNotaryStatus";
import { getNotaryTimelineBullet } from "@/utils/getNotaryTimelineBullet";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Alert,
  Badge,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Timeline,
  Title,
} from "@mantine/core";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface ViewNotaryRequestDrawerProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
}

export const ViewNotaryRequestDrawer = ({
  opened,
  onClose,
  notaryRequestId,
}: ViewNotaryRequestDrawerProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const fetchNotaryRequest = async () => {
    setIsFetching(true);

    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
      );
      if (snap.exists()) {
        setNotaryRequestData({
          ...(snap.data() as NotaryRequest),
          id: snap.id,
        });
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch data",
        message: "The request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setIsFetching(false);
      setNotaryRequestData(null);
    }

    if (opened && notaryRequestId) fetchNotaryRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const formatFee = (fee: number) => {
    return `₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Text c="green" fw={600}>
            Request
          </Text>
          {getNotaryStatus(
            notaryRequestData?.status ?? NotaryRequestStatus.SUBMITTED,
          )}
        </Group>
      }
      styles={{ header: { width: "100%" } }}
      position="right"
      size="xl"
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching request data...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack>
          <SimpleGrid cols={2}>
            <DetailField
              title="Created Date"
              value={getDateFormatDisplay(
                notaryRequestData?.createdAt || "",
                true,
              )}
            />
            <DetailField
              title="Full Name"
              value={notaryRequestData?.requestor.fullname}
            />
            <DetailField
              title="Email"
              value={notaryRequestData?.requestor.email}
            />
          </SimpleGrid>
          <DetailField
            title="Description"
            value={notaryRequestData?.description}
          />

          <Divider my="lg" label="Additional Details" labelPosition="center" />

          <SimpleGrid cols={2}>
            <DetailField
              title="Fee"
              value={
                notaryRequestData?.paymentFields?.fee
                  ? formatFee(notaryRequestData?.paymentFields?.fee || 0)
                  : "TBD"
              }
            />
            <DetailField
              title="Payment Status"
              value={
                <Badge
                  color={
                    notaryRequestData?.paymentFields?.isPaid ? "green" : "red"
                  }
                  variant="filled"
                  size="xs"
                >
                  {notaryRequestData?.paymentFields?.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              }
            />
            <DetailField
              title="Pickup Type"
              value={notaryRequestData?.pickupBranch}
            />
            <DetailField
              title="Pickup Date"
              value={
                notaryRequestData?.pickupBranch === "Soft copy only"
                  ? undefined
                  : notaryRequestData?.pickupDate
                    ? getDateFormatDisplay(
                        notaryRequestData.pickupDate as string,
                      )
                    : undefined
              }
            />
          </SimpleGrid>

          <Divider my="lg" />

          {notaryRequestData?.timeline &&
            notaryRequestData?.timeline.length > 0 && (
              <Timeline
                bulletSize={24}
                lineWidth={2}
                styles={{
                  itemTitle: { fontSize: 14 },
                  itemBullet: { background: "transparent", border: "none" },
                }}
              >
                {notaryRequestData?.timeline
                  .sort((a, b) => b.dateAndTime.localeCompare(a.dateAndTime))
                  .map((item) => (
                    <Timeline.Item
                      key={item.id}
                      bullet={getNotaryTimelineBullet(item.status)}
                      styles={{
                        itemBullet: {
                          background: getNotaryStatusColor(item.status),
                        },
                      }}
                    >
                      <Alert
                        color={getNotaryStatusColor(item.status)}
                        p="xs"
                        mb="2"
                      >
                        <Stack gap="sm">
                          <Group justify="space-between" align="center">
                            <Title
                              order={6}
                              c={getNotaryStatusColor(item.status)}
                            >
                              {item.title}
                            </Title>

                            <Text size="xs">
                              by:{" "}
                              <Text span c="green" fw={700}>
                                {item.user.fullname}
                              </Text>
                            </Text>
                          </Group>

                          <Text size="xs" c="black">
                            {item.description}
                          </Text>

                          {item.reason && (
                            <Text size="xs" c="black">
                              <strong>Remarks:</strong> {item.reason}
                            </Text>
                          )}
                        </Stack>
                      </Alert>

                      <Text size="xs" ta="right">
                        {getDateFormatDisplay(item.dateAndTime, true)}
                      </Text>
                    </Timeline.Item>
                  ))}
              </Timeline>
            )}
        </Stack>
      )}
    </Drawer>
  );
};
