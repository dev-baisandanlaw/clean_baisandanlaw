import { Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Modal,
  Stack,
  Text,
  Table,
  Group,
  Button,
  Badge,
  Paper,
  ThemeIcon,
  useMantineTheme,
  em,
  Flex,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowDown,
  IconArrowRight,
  IconPackage,
  IconStar,
} from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";

interface DowngradeSubscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  clientDetails: Client | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DowngradeSubscriptionModal({
  opened,
  onClose,
  clientDetails,
  setDataChanged,
}: DowngradeSubscriptionModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const theme = useMantineTheme();

  const [isLoading, setIsLoading] = useState(false);

  const handleCancelSubscription = async () => {
    setIsLoading(true);

    try {
      await axios.patch("/api/clerk/user/update-user-metadata", {
        userId: clientDetails?.id,
        unsafe_metadata: {
          ...clientDetails?.unsafe_metadata,
          subscription: {
            ...clientDetails?.unsafe_metadata?.subscription,
            isSubscribed: false,
            subscribedEndDate: null,
            subscribedStartDate: null,
          },
        },
      });
      appNotifications.success({
        title: "Subscription Canceled",
        message: "The subscription has been canceled successfully.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to cancel subscription",
        message: "The subscription could not be canceled. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientDetails) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cancel Premium Subscription"
      centered
      transitionProps={{ transition: "pop" }}
      size="xl"
      withCloseButton={!isLoading}
    >
      <Stack>
        <Text>
          Are you sure you want to{" "}
          <Text span fw={600} c="red">
            Cancel
          </Text>{" "}
          the Premium Plan subscription for this client?
        </Text>

        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={isMobile ? 120 : 160}>Client Name</Table.Th>
              <Table.Td>
                {clientDetails.first_name} {clientDetails.last_name}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={isMobile ? 120 : 160}>Email</Table.Th>
              <Table.Td>
                {clientDetails.email_addresses[0].email_address}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={isMobile ? 120 : 160}>Phone Number</Table.Th>
              <Table.Td>
                {clientDetails.unsafe_metadata?.phoneNumber || "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={isMobile ? 120 : 160}>Member Since</Table.Th>
              <Table.Td>
                {getDateFormatDisplay(clientDetails.created_at, true)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={isMobile ? 120 : 160}>Total Subscriptions</Table.Th>
              <Table.Td>
                {clientDetails.unsafe_metadata?.subscription?.count || 0}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Group mt="lg" align="flex-start" wrap="nowrap">
          <Stack flex={1}>
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
                    color="green"
                    leftSection={<IconStar size={18} />}
                  >
                    Premium
                  </Badge>
                  <Text size="xs" c="dimmed">
                    Valid until:{" "}
                    <Text span fw={600} c="black">
                      {clientDetails.unsafe_metadata?.subscription
                        ?.subscribedEndDate
                        ? getDateFormatDisplay(
                            clientDetails.unsafe_metadata?.subscription
                              ?.subscribedEndDate,
                            true
                          )
                        : "-"}
                    </Text>
                  </Text>
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
                    color={theme.colors.gray[9]}
                    w={100}
                    leftSection={<IconPackage size={18} />}
                  >
                    Basic
                  </Badge>
                </Stack>
              </Flex>
            </Paper>

            <Group grow mt="lg">
              <Button
                variant="default"
                onClick={onClose}
                disabled={isLoading}
                c="black"
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color="red"
                onClick={handleCancelSubscription}
                loading={isLoading}
              >
                Cancel Subscription
              </Button>
            </Group>
          </Stack>
        </Group>
      </Stack>
    </Modal>
  );
}
