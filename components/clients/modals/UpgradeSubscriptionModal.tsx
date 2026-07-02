import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import { ClientRow } from "@/components/data-table/columns/ClientColumns";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Badge,
  Button,
  em,
  Flex,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowDown,
  IconArrowRight,
  IconPackage,
  IconStarFilled,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSubscribeClientMutation } from "@/store/services/userService";

interface UpgradeSubscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  clientDetails: ClientRow | null;
}

const minDate = dayjs().add(2, "day").toDate();

export default function UpgradeSubscriptionModal({
  opened,
  onClose,
  clientDetails,
}: UpgradeSubscriptionModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const theme = useMantineTheme();

  const [subscribeClient, { isLoading }] = useSubscribeClientMutation();
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    if (opened) setSubscriptionEndDate(minDate);
  }, [opened]);

  const handleUpgradeSubscription = async () => {
    if (!clientDetails?.email || !subscriptionEndDate) return;

    try {
      await subscribeClient({
        clientEmail: clientDetails.email,
        endsAt: dayjs(subscriptionEndDate).format("YYYY-MM-DD"),
      }).unwrap();

      appNotifications.success({
        title: "Subscription Upgraded",
        message: "The subscription has been upgraded successfully.",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to upgrade subscription",
        message: "The subscription could not be upgraded. Please try again.",
      });
    }
  };

  if (!clientDetails) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Upgrade Subscription"
      type="success"
      size="xl"
      closable={!isLoading}
    >
      <Stack>
        <Text>
          Are you sure you want to upgrade this client&apos;s subscription to{" "}
          <Text span fw={600} c="green">
            Premium Plan
          </Text>
          ?
        </Text>

        <BasicCard title="Client's Information">
          <SimpleGrid cols={2}>
            <DetailField title="Client Name" value={clientDetails?.fullname} />
            <DetailField title="Email" value={clientDetails?.email} />
            <DetailField title="Phone Number" value={clientDetails?.phone} />
            <DetailField
              title="Total Subscriptions"
              value={clientDetails?.metadata?.subscription?.count || "0"}
            />
          </SimpleGrid>
        </BasicCard>

        <Flex
          mt="lg"
          align={isMobile ? "center" : "flex-start"}
          direction={isMobile ? "column" : "row"}
        >
          <Stack gap="xs">
            <Text size="sm" fw={600} ta={isMobile ? "center" : "left"}>
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

          <Stack flex={1} mt={isMobile ? "sm" : 0} ml={isMobile ? 0 : "sm"}>
            <Paper shadow="sm" p="md" bg="#f5f5f5">
              <Flex
                gap="xs"
                align="center"
                justify={isMobile ? "center" : "space-between"}
                direction={isMobile ? "column" : "row"}
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
                  {isMobile ? (
                    <IconArrowDown size={20} />
                  ) : (
                    <IconArrowRight size={20} />
                  )}
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
              </Flex>
            </Paper>

            <Table variant="vertical" layout="fixed">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th w={isMobile ? 120 : 180}>
                    Subscription Start Date
                  </Table.Th>
                  <Table.Td c="green" fw={600}>
                    {getDateFormatDisplay(dayjs().toDate())}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th w={isMobile ? 120 : 180}>
                    Subscription End Date
                  </Table.Th>
                  <Table.Td c="green" fw={600}>
                    {subscriptionEndDate
                      ? getDateFormatDisplay(
                          dayjs(subscriptionEndDate)
                            .set("hour", 23)
                            .set("minute", 59)
                            .toDate(),
                          true,
                        )
                      : "-"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th w={isMobile ? 120 : 180}>Total Days</Table.Th>
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
                disabled={!clientDetails.email || !subscriptionEndDate}
              >
                Upgrade Subscription
              </Button>
            </Group>
          </Stack>
        </Flex>
      </Stack>
    </AppModal>
  );
}
