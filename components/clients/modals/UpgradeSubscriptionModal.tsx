import { Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import {
  IconArrowRight,
  IconPackage,
  IconStarFilled,
} from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

interface UpgradeSubscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  clientDetails: Client | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

const minDate = dayjs().add(2, "day").toDate();

export default function UpgradeSubscriptionModal({
  opened,
  onClose,
  clientDetails,
  setDataChanged,
}: UpgradeSubscriptionModalProps) {
  const theme = useMantineTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(
    null
  );

  useEffect(() => {
    if (opened) setSubscriptionEndDate(minDate);
  }, [opened]);

  const handleUpgradeSubscription = async () => {
    setIsLoading(true);

    try {
      await axios.patch("/api/clerk/user/update-user-metadata", {
        userId: clientDetails?.id,
        unsafe_metadata: {
          ...clientDetails?.unsafe_metadata,
          subscription: {
            count:
              (clientDetails?.unsafe_metadata?.subscription?.count || 0) + 1,
            isSubscribed: true,
            subscribedStartDate: dayjs().toDate(),
            subscribedEndDate: subscriptionEndDate
              ? dayjs(subscriptionEndDate)
                  .set("hour", 23)
                  .set("minute", 59)
                  .toDate()
              : null,
          },
        },
      });

      appNotifications.success({
        title: "Subscription Upgraded",
        message: "The subscription has been upgraded successfully.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientDetails) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Upgrade Subscription"
      centered
      transitionProps={{ transition: "pop" }}
      size="xl"
      withCloseButton={!isLoading}
    >
      <Stack>
        <Text>
          Are you sure you want to upgrade this client&apos;s subscription to{" "}
          <Text span fw={600} c="green">
            Premium Plan
          </Text>
          ?
        </Text>

        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Client Name</Table.Th>
              <Table.Td>
                {clientDetails.first_name} {clientDetails.last_name}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Email</Table.Th>
              <Table.Td>
                {clientDetails.email_addresses[0].email_address}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Phone Number</Table.Th>
              <Table.Td>
                {clientDetails.unsafe_metadata?.phoneNumber || "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Member Since</Table.Th>
              <Table.Td>
                {getDateFormatDisplay(clientDetails.created_at, true)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Total Subscriptions</Table.Th>
              <Table.Td>
                {clientDetails.unsafe_metadata?.subscription?.count || 0}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Group mt="lg" align="flex-start" wrap="nowrap">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Subscription End Date
            </Text>
            <DatePicker
              hideOutsideDates
              minDate={minDate}
              value={subscriptionEndDate}
              onChange={(date) =>
                setSubscriptionEndDate(date ? new Date(date) : null)
              }
            />
          </Stack>

          <Stack flex={1}>
            <Paper shadow="sm" p="md" bg="#f5f5f5">
              <Group
                gap="xs"
                align="center"
                justify="space-between"
                wrap="nowrap"
              >
                <Stack align="center" gap="xs">
                  <Text size="sm" fw={600}>
                    Current Plan
                  </Text>
                  <Badge
                    size="lg"
                    radius="xs"
                    color={theme.colors.gray[9]}
                    w={100}
                    leftSection={<IconPackage size={18} />}
                  >
                    Basic
                  </Badge>
                </Stack>

                <ThemeIcon variant="transparent" my="lg">
                  <IconArrowRight size={20} />
                </ThemeIcon>

                <Stack align="center" gap="xs">
                  <Text size="sm" fw={600}>
                    New Plan
                  </Text>
                  <Badge
                    size="lg"
                    radius="xs"
                    color="green"
                    leftSection={<IconStarFilled size={18} />}
                  >
                    Premium
                  </Badge>
                </Stack>
              </Group>
            </Paper>

            <Table variant="vertical" layout="fixed">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th w={180}>Subscription Start Date</Table.Th>
                  <Table.Td c="green" fw={600}>
                    {getDateFormatDisplay(dayjs().toDate(), true)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th w={180}>Subscription End Date</Table.Th>
                  <Table.Td c="green" fw={600}>
                    {subscriptionEndDate
                      ? getDateFormatDisplay(
                          dayjs(subscriptionEndDate)
                            .set("hour", 23)
                            .set("minute", 59)
                            .toDate(),
                          true
                        )
                      : "-"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th w={180}>Total Days</Table.Th>
                  <Table.Td c="green" fw={600}>
                    {subscriptionEndDate
                      ? dayjs(subscriptionEndDate).diff(dayjs(), "day")
                      : "-"}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>

            <Group grow>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="filled"
                color="green"
                onClick={handleUpgradeSubscription}
                loading={isLoading}
              >
                Upgrade Subscription
              </Button>
            </Group>
          </Stack>
        </Group>
      </Stack>
    </Modal>
  );
}
