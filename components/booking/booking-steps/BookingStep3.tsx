import { PaymentChannelSetting } from "@/types/bookingSettings";
import {
  ActionIcon,
  Alert,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconCash,
  IconCopy,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Dispatch, SetStateAction, useState } from "react";
import MultiFileUploadComp from "@/components/Common/MultiFileUploadComp";

interface BookingStepThreeProps {
  uploadedReceipt: File | null;
  setUploadedReceipt: Dispatch<SetStateAction<File | null>>;
  fee: number;
  paymentChannels: PaymentChannelSetting[];
}
export default function BookingStepThree({
  setUploadedReceipt,
  uploadedReceipt,
  fee,
  paymentChannels = [],
}: BookingStepThreeProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const receiptFiles = uploadedReceipt ? [uploadedReceipt] : [];
  const setReceiptFiles: Dispatch<SetStateAction<File[]>> = (value) => {
    const nextFiles = typeof value === "function" ? value(receiptFiles) : value;

    setUploadedReceipt(nextFiles[0] ?? null);
  };

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <Stack>
      <Alert
        color="blue"
        variant="light"
        icon={<IconInfoCircle />}
        styles={(theme) => ({
          title: { fontWeight: 600, color: theme.colors.blue[7] },
          message: { color: theme.colors.blue[7] },
          body: { gap: 2 },
        })}
        title="Payment Confirmation Required"
      >
        <Text size="sm">
          To secure your booking, please complete the payment and upload your
          receipt. Our staff will verify your payment.
        </Text>
      </Alert>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Consultation Fee
          </Text>
          <Text size="lg" fw={700} c="green.7">
            ₱
            {fee.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
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
              <Paper key={index} withBorder p="sm" radius="sm" bg="gray.0">
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
                      onClick={() => handleCopy(channel.accountNumber, index)}
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

      <Paper withBorder p="md" radius="md">
        <Text size="sm" fw={600} mb="xs">
          Upload Payment Receipt <span style={{ color: "red" }}>*</span>
        </Text>

        <MultiFileUploadComp
          files={receiptFiles}
          setFiles={setReceiptFiles}
          acceptImage
          maxFiles={1}
        />
      </Paper>
    </Stack>
  );
}
