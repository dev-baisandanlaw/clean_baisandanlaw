"use client";

import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { Dropzone, FileRejection, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconCash,
  IconCheck,
  IconCloudUpload,
  IconCopy,
  IconX,
} from "@tabler/icons-react";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { GlobalSched } from "@/types/global-sched";
import { useUser } from "@clerk/nextjs";
import { setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { appNotifications } from "@/utils/notifications/notifications";
import axios from "axios";

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS2_5ClientModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: PaymentModalProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);
  const [globalSched, setGlobalSched] = useState<GlobalSched | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");

  const fee = notaryRequestData?.paymentFields?.fee || 0;
  const paymentChannels = globalSched?.fees?.paymentChannels || [];

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [notarySnap, schedSnap] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId)),
        getDoc(
          doc(
            db,
            COLLECTIONS.GLOBAL_SCHED,
            process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
          ),
        ),
      ]);

      if (notarySnap.exists()) {
        setNotaryRequestData({
          ...(notarySnap.data() as NotaryRequest),
          id: notarySnap.id,
        });
      }

      if (schedSnap.exists()) {
        setGlobalSched(schedSnap.data() as GlobalSched);
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch data",
        message: "Could not load payment information. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setFile(null);
      setRejectedFiles([]);
      setDisclaimer("");
      setIsFetching(false);
      setNotaryRequestData(null);
      setGlobalSched(null);
    } else {
      if (notaryRequestId) {
        fetchData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleDrop = (newFiles: File[]) => {
    setRejectedFiles([]);
    if (file) return;

    const acceptedFiles = newFiles.slice(0, 1);
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

  const handleClose = () => {
    if (!isSubmitting) {
      setFile(null);
      setRejectedFiles([]);
      setDisclaimer("");
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!file || !notaryRequestData) return;

    setIsSubmitting(true);
    try {
      // Upload receipt to Google Drive
      const formData = new FormData();
      formData.append(
        "file",
        file,
        `[${notaryRequestData.requestor.email}]-[receipt]`,
      );
      formData.append(
        "parentId",
        process.env.NEXT_PUBLIC_GOOGLE_RECEIPTS_APPOINTMENTS_FOLDER_ID!,
      );

      const { data } = await axios.post(
        "/api/google/drive/upload_receipts",
        formData,
      );

      const receiptFileId = data?.uploadedFiles?.id;

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          paymentFields: {
            ...notaryRequestData.paymentFields,
            receiptFileId: receiptFileId,
          },
          timeline: [
            ...(notaryRequestData.timeline || []),
            {
              id: nanoid(8),
              title: "FOR_ADMIN_PAYMENT_VERIFICATION",
              description: "Payment receipt uploaded for verification",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
            },
          ],
        },
        { merge: true },
      );

      appNotifications.success({
        title: "Receipt submitted",
        message: "Your payment receipt has been submitted for verification.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to upload receipt",
        message: "Could not upload your receipt. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Payment Required"
      withCloseButton={!isSubmitting}
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Loading payment information...</Text>
          </Stack>
        </Center>
      ) : (
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
              To proceed with your request, please complete the payment and
              upload your receipt. Our staff will verify your payment before
              processing begins.
            </Text>
          </Alert>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Request Fee
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

          <Alert
            color="blue"
            variant="light"
            styles={(theme) => ({
              message: { color: theme.colors.blue[7], fontSize: 12 },
            })}
          >
            After submitting your receipt, our staff will verify your payment.
            Processing will begin once your payment is confirmed.
          </Alert>

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
      )}
    </Modal>
  );
}
