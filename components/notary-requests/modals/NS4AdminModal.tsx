import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import { COLLECTIONS } from "@/constants/constants";
import { approveNotaryRequest } from "@/firebase/approveNotaryRequest";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { formatFee } from "@/utils/formatFee";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconCloudUpload, IconFileTypePdf, IconX } from "@tabler/icons-react";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { SetStateAction, Dispatch, useEffect, useState } from "react";

interface ApproveNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS4AdminModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: ApproveNotaryRequestModalProps) {
  const { user } = useUser();

  const [file, setFile] = useState<(File & { id?: string }) | null>(null);
  const [isApproving, setIsApproving] = useState(false);

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
        title: "Failed to fetch  request data",
        message: "The  request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setFile(null);
      setIsFetching(false);
      setNotaryRequestData(null);
    }

    if (opened && notaryRequestId) {
      fetchNotaryRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  useEffect(() => {
    if (notaryRequestData) {
      if (notaryRequestData?.documents?.finishedFile?.id) {
        setFile({
          name: notaryRequestData.documents.finishedFile.name,
          id: notaryRequestData.documents.finishedFile.id,
        } as unknown as File & { id?: string });
      }
    }
  }, [notaryRequestId, notaryRequestData, opened]);

  if (!notaryRequestData) return null;

  const isRevision =
    notaryRequestData.status === NotaryRequestStatus.NEEDS_ATTORNEY_REVISION;

  const handleApproveNotaryRequest = async () => {
    setIsApproving(true);
    let fileId = null;
    try {
      if (file?.size) {
        // 1. Delete the existing file from Google Drive
        if (notaryRequestData?.documents?.finishedFile?.id) {
          await axios.delete(
            `/api/google/drive/delete/${notaryRequestData.documents.finishedFile.id}`,
          );
        }

        // 2. Upload the new file to Google Drive
        const fd = new FormData();
        fd.append("parentId", notaryRequestData.documents.googleDriveFolderId);
        fd.append("file", file);
        const { data: uploadedFile } = await axios.post(
          "/api/google/drive/upload",
          fd,
        );

        fileId = uploadedFile.uploadedFiles.id;
      }

      // 3. Approve the notary request
      await approveNotaryRequest(notaryRequestData, user!, {
        id: fileId,
        name: file!.name,
      });

      appNotifications.success({
        title: "Finished document uploaded",
        message: isRevision
          ? "The revised document has been uploaded for client review."
          : "The finished document has been uploaded for client review.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to approve  request",
        message: "The  request could not be approved. Please try again.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const preview = (
    <Paper pos="relative" withBorder radius="md" w="100%">
      <Flex
        bdrs="md"
        bg="gray.0"
        w="100%"
        h={125}
        align="center"
        justify="center"
        direction="column"
      >
        <ThemeIcon variant="transparent" size={48} my="auto">
          <IconFileTypePdf size={48} />
        </ThemeIcon>
        <Text size="sm" truncate ml="2" fw={600} c="green">
          {file?.name}
        </Text>
      </Flex>

      <ActionIcon
        disabled={isApproving}
        pos="absolute"
        color="red"
        top={5}
        right={5}
        size={24}
        onClick={() => setFile(null)}
      >
        <IconX size={16} />
      </ActionIcon>
    </Paper>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isRevision
          ? "Upload Revised Finished Document"
          : "Upload Finished Document"
      }
      centered
      transitionProps={{ transition: "pop" }}
      size="xl"
      withCloseButton={!isApproving}
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching request data...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <BasicCard title="Request Details">
            <SimpleGrid cols={2}>
              <DetailField
                title="Requestor"
                value={notaryRequestData?.requestor.fullname}
              />
              <DetailField
                title="Email"
                value={notaryRequestData?.requestor.email}
              />

              <DetailField
                title="Fee"
                value={formatFee(notaryRequestData?.paymentFields?.fee || 0)}
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
                    {notaryRequestData?.paymentFields?.isPaid
                      ? "Paid"
                      : "Unpaid"}
                  </Badge>
                }
              />
            </SimpleGrid>
          </BasicCard>

          <Divider label="Upload finished document" />

          {!file && (
            <Dropzone
              styles={{
                root: {
                  border: `2px dashed ${!!file ? "gray" : "green"}`,
                },
              }}
              accept={[...PDF_MIME_TYPE]}
              maxSize={5 * 1024 * 1024}
              maxFiles={1}
              style={{ cursor: "pointer" }}
              onDrop={(files) => setFile(files[0])}
            >
              <Stack
                align="center"
                justify="center"
                gap="10"
                mih={100}
                style={{ pointerEvents: "none" }}
              >
                <IconCloudUpload size={50} color={!!file ? "gray" : "green"} />
                <Text>
                  <Text span fw={700} c="green">
                    Click here
                  </Text>{" "}
                  to upload your files or drag
                </Text>
                <Text c={!!file ? "dimmed" : "green"} size="sm" fw={500}>
                  Supported format{" "}
                  <Text span fw={700}>
                    PDF
                  </Text>{" "}
                  (Max 1 file, 5MB)
                </Text>
              </Stack>
            </Dropzone>
          )}

          <Group align="center" justify="center">
            {file ? preview : null}
          </Group>

          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose} disabled={isApproving}>
              Cancel
            </Button>

            <Button
              disabled={!file}
              loading={isApproving}
              onClick={handleApproveNotaryRequest}
            >
              {isRevision
                ? "Upload Revised Document"
                : "Upload Finished Document"}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
