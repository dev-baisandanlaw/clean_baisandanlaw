import AppModal from "@/components/Common/modal/AppModal";
import MultiFileUploadComp from "@/components/Common/MultiFileUploadComp";
import { useGetBookingSettingsQuery } from "@/store/services/bookingService";
import { useSubmitClientRequestPaymentMutation } from "@/store/services/clientRequestService";
import { formatFee } from "@/utils/formatFee";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconCash,
  IconCheck,
  IconCopy,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

interface ClientRequestPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
  fee: number;
}

export default function ClientRequestPaymentModal({
  opened,
  onClose,
  clientRequestId,
  fee,
}: ClientRequestPaymentModalProps) {
  const [submitClientRequestPaymentFn, { isLoading: isSubmitting }] =
    useSubmitClientRequestPaymentMutation();
  const { data: bookingSettings } = useGetBookingSettingsQuery(undefined, {
    skip: !opened,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const paymentChannels = useMemo(
    () =>
      bookingSettings?.paymentChannels.filter((channel) => channel.enabled) ??
      [],
    [bookingSettings],
  );

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    setFiles([]);
    setCopiedIndex(null);
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    const file = files[0];
    if (!clientRequestId || !file) return;

    try {
      await submitClientRequestPaymentFn({
        id: clientRequestId,
        file,
      }).unwrap();

      appNotifications.success({
        title: "Payment submitted",
        message: "Your payment receipt has been submitted for verification.",
      });
      handleClose();
    } catch {
      appNotifications.error({
        title: "Failed to submit payment",
        message: "Please check your receipt and try again.",
      });
    }
  };

  return (
    <AppModal
      opened={opened}
      onClose={handleClose}
      title="Fee Payment"
      type="success"
      size="lg"
      closable={!isSubmitting}
    >
      <Stack>
        <Alert
          color="blue"
          variant="light"
          icon={<IconInfoCircle />}
          title="Payment Required"
        >
          <Text size="sm">
            Please pay the admin-set fee first and upload your receipt so we can
            verify payment before processing your request.
          </Text>
        </Alert>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Request Fee
            </Text>
            <Text size="lg" fw={700} c="green.7">
              {formatFee(fee)}
            </Text>
          </Group>
        </Paper>

        {paymentChannels.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb="sm">
              <ThemeIcon variant="light" color="green" size="sm">
                <IconCash size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                Payment Channels
              </Text>
            </Group>

            <Stack gap="xs">
              {paymentChannels.map((channel, index) => (
                <Paper
                  key={channel.id}
                  withBorder
                  p="sm"
                  radius="sm"
                  bg="gray.0"
                >
                  <Text size="xs" fw={600} c="dimmed" mb={4}>
                    {channel.name}
                  </Text>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2}>
                      <Text size="sm">{channel.accountName}</Text>
                      <Text size="sm" fw={600}>
                        {channel.accountNumber}
                      </Text>
                    </Stack>
                    <Tooltip
                      label={copiedIndex === index ? "Copied!" : "Copy"}
                      position="top"
                    >
                      <ActionIcon
                        variant="subtle"
                        c="black"
                        color={copiedIndex === index ? "green" : "gray"}
                        onClick={() =>
                          handleCopy(channel.accountNumber, index)
                        }
                      >
                        {copiedIndex === index ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}

        <MultiFileUploadComp
          files={files}
          setFiles={setFiles}
          acceptImage
          acceptPdf
          maxFiles={1}
          disabled={isSubmitting}
        />
      </Stack>

      <Group justify="end" mt={16}>
        <Button
          variant="default"
          onClick={handleClose}
          disabled={isSubmitting}
          size="sm"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          color="green.7"
          disabled={files.length === 0 || !clientRequestId}
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </Group>
    </AppModal>
  );
}
