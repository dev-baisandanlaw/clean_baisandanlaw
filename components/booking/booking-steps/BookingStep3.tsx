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
import { Dropzone, FileRejection, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  IconCash,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconAlertCircle,
  IconCloudUpload,
  IconX,
} from "@tabler/icons-react";
import { Dispatch, SetStateAction, useState } from "react";

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
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDrop = (newFiles: File[]) => {
    setRejectedFiles([]);
    if (uploadedReceipt) return; // Already have a file

    const acceptedFiles = newFiles.slice(0, 1); // Take only the first file
    if (acceptedFiles.length > 0) {
      setUploadedReceipt(acceptedFiles[0]);
    }

    const droppedCount = newFiles.length - acceptedFiles.length;
    if (droppedCount > 0) {
      setDisclaimer("Only one file is allowed. Extra files ignored.");
    }
  };

  const handleRemoveFile = () => {
    setRejectedFiles([]);
    setDisclaimer("");
    setUploadedReceipt(null);
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

        {rejectedFiles.length > 0 && (
          <Alert
            color="red"
            title={`${rejectedFiles.length} file(s) rejected due to file type or size limit`}
            icon={<IconAlertCircle />}
            mb="md"
          />
        )}

        {uploadedReceipt && disclaimer && (
          <Alert
            color="orange"
            title={disclaimer}
            icon={<IconAlertCircle />}
            mb="md"
          />
        )}

        <Dropzone
          styles={{
            root: {
              border: `2px dashed ${uploadedReceipt ? "gray" : "green"}`,
            },
          }}
          accept={[...IMAGE_MIME_TYPE]}
          onDrop={handleDrop}
          onReject={setRejectedFiles}
          maxSize={5 * 1024 * 1024}
          mb="md"
          disabled={!!uploadedReceipt}
          bg={uploadedReceipt ? "gray.2" : "#f6fcfb"}
          style={{ cursor: uploadedReceipt ? "not-allowed" : "pointer" }}
        >
          <Stack
            align="center"
            justify="center"
            gap="10"
            mih={100}
            style={{ pointerEvents: "none" }}
          >
            <IconCloudUpload
              size={50}
              color={uploadedReceipt ? "gray" : "green"}
            />
            <Text ta="center">
              <Text span fw={700} c="green">
                Click here
              </Text>{" "}
              to upload your receipt or drag
            </Text>
            <Text
              c={uploadedReceipt ? "dimmed" : "green"}
              size="sm"
              fw={500}
              ta="center"
            >
              Supported formats:{" "}
              <Text span fw={700}>
                Images
              </Text>{" "}
              (Max 1 file, 5MB per file)
            </Text>
          </Stack>
        </Dropzone>

        {uploadedReceipt && (
          <Paper withBorder p="sm" radius="sm" bg="gray.0">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {uploadedReceipt.name}
              </Text>
              <ActionIcon
                color="red"
                size="sm"
                onClick={handleRemoveFile}
                //   disabled={isSubmitting}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        )}
      </Paper>
    </Stack>
  );
}
