"use client";

import {
  ActionIcon,
  Alert,
  Divider,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { GlobalSched } from "@/types/global-sched";
import {
  IconAlertCircle,
  IconCash,
  IconCheck,
  IconCloudUpload,
  IconCopy,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import dayjs from "dayjs";
import { TimeValue } from "@mantine/dates";
import { Dropzone, FileRejection, IMAGE_MIME_TYPE } from "@mantine/dropzone";

interface BookingPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  globalSched: GlobalSched | null;
  selectedDate: string | null;
  selectedTime: string | null;
  onSubmit: (receiptFile: File) => void;
  isSubmitting: boolean;
}

export default function BookingPaymentModal({
  opened,
  onClose,
  globalSched,
  selectedDate,
  selectedTime,
  onSubmit,
  isSubmitting,
}: BookingPaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");

  const appointmentFee = globalSched?.fees?.appointmentPerHour || 0;
  const paymentChannels = globalSched?.fees?.paymentChannels || [];

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDrop = (newFiles: File[]) => {
    setRejectedFiles([]);
    if (file) return; // Already have a file

    const acceptedFiles = newFiles.slice(0, 1); // Take only the first file
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }

    const droppedCount = newFiles.length - acceptedFiles.length;
    if (droppedCount > 0) {
      setDisclaimer("Only one file is allowed. Extra files ignored.");
    }
  };

  const handleRemoveFile = () => {
    setRejectedFiles([]);
    setDisclaimer("");
    setFile(null);
  };

  const handleSubmit = () => {
    if (file) {
      onSubmit(file);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFile(null);
      setRejectedFiles([]);
      setDisclaimer("");
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Payment Required"
      withCloseButton={!isSubmitting}
      centered
      size="lg"
    >
      <Stack gap="md">
        <Alert
          color="orange"
          variant="light"
          icon={<IconAlertCircle />}
          styles={(theme) => ({
            title: { fontWeight: 600, color: theme.colors.orange[7] },
            message: { color: theme.colors.orange[7] },
            body: { gap: 2 },
          })}
          title="Payment Confirmation Required"
        >
          <Text size="sm">
            To secure your booking, please complete the payment and upload your
            receipt. Our staff will verify your payment and send you an email
            confirmation once approved.
          </Text>
        </Alert>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Appointment Date & Time
            </Text>
            <Text size="sm" fw={600}>
              {selectedDate && dayjs(selectedDate).format("MMMM D, YYYY")} at{" "}
              {selectedTime && <TimeValue value={selectedTime} format="12h" />}
            </Text>
          </Group>
          <Divider my="xs" />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Consultation Fee
            </Text>
            <Text size="lg" fw={700} c="green.7">
              ₱
              {appointmentFee.toLocaleString("en-PH", {
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
                    {channel.channelName}
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

          {file && disclaimer && (
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
                border: `2px dashed ${file ? "gray" : "green"}`,
              },
            }}
            accept={[...IMAGE_MIME_TYPE]}
            onDrop={handleDrop}
            onReject={setRejectedFiles}
            maxSize={5 * 1024 * 1024}
            mb="md"
            disabled={!!file}
            bg={file ? "gray.2" : "#f6fcfb"}
            style={{ cursor: file ? "not-allowed" : "pointer" }}
          >
            <Stack
              align="center"
              justify="center"
              gap="10"
              mih={100}
              style={{ pointerEvents: "none" }}
            >
              <IconCloudUpload size={50} color={file ? "gray" : "green"} />
              <Text ta="center">
                <Text span fw={700} c="green">
                  Click here
                </Text>{" "}
                to upload your receipt or drag
              </Text>
              <Text
                c={file ? "dimmed" : "green"}
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

          {file && (
            <Paper withBorder p="sm" radius="sm" bg="gray.0">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {file.name}
                </Text>
                <ActionIcon
                  color="red"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Paper>
          )}
        </Paper>

        <Group justify="flex-end" mt="sm">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file}
            loading={isSubmitting}
          >
            Submit Receipt
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
