import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import { ClientRow } from "@/components/data-table/columns/Clientcolumns";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Stack,
  Text,
  Group,
  Button,
  Badge,
  Paper,
  ThemeIcon,
  useMantineTheme,
  em,
  Flex,
  SimpleGrid,
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
  clientDetails: ClientRow | null;
}

export default function DowngradeSubscriptionModal({
  opened,
  onClose,
  clientDetails,
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
          ...clientDetails?.metadata,
          subscription: {
            ...clientDetails?.metadata?.subscription,
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
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Cancel Premium Subscription"
      type="danger"
      size="xl"
      closable={!isLoading}
    >
      <Stack>
        <Text>
          Are you sure you want to{" "}
          <Text span fw={600} c="red">
            Cancel
          </Text>{" "}
          the Premium Plan subscription for this client?
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
                      {clientDetails.metadata?.subscription?.subscribedEndDate
                        ? getDateFormatDisplay(
                            clientDetails.metadata?.subscription
                              ?.subscribedEndDate,
                            true,
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
                variant="filled"
                color="red.5"
                onClick={handleCancelSubscription}
                loading={isLoading}
              >
                Cancel Subscription
              </Button>
            </Group>
          </Stack>
        </Group>
      </Stack>
    </AppModal>
  );
}
