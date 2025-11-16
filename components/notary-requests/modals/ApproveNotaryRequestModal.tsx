import { COLLECTIONS } from "@/constants/constants";
import { approveNotaryRequest } from "@/firebase/approveNotaryRequest";
import { db } from "@/firebase/config";
import { syncToAppwrite } from "@/lib/syncToAppwrite";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus } from "@/utils/getNotaryStatus";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
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

export default function ApproveNotaryRequestModal({
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
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId)
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
        title: "Failed to fetch notary request data",
        message:
          "The notary request data could not be fetched. Please try again.",
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

  const handleApproveNotaryRequest = async () => {
    setIsApproving(true);
    let fileId = null;
    try {
      if (file?.size) {
        // 1. Delete the existing file from Google Drive
        if (notaryRequestData?.documents?.finishedFile?.id) {
          await axios.delete(
            `/api/google/drive/delete/${notaryRequestData.documents.finishedFile.id}`
          );
        }

        // 2. Upload the new file to Google Drive
        const fd = new FormData();
        fd.append("parentId", notaryRequestData.documents.googleDriveFolderId);
        fd.append("file", file);
        const { data: uploadedFile } = await axios.post(
          "/api/google/drive/upload",
          fd
        );

        fileId = uploadedFile.uploadedFiles.id;
      }

      // 3. Approve the notary request
      await approveNotaryRequest(notaryRequestData, user!, {
        id: fileId,
        name: file!.name,
      });

      // 4. Update the notary request in Appwrite
      await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
        documentFinishedFileId: fileId,
        status: NotaryRequestStatus.FOR_CLIENT_REVIEW,
      });

      appNotifications.success({
        title: "Notary request approved",
        message: "The notary request has been approved successfully",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to approve notary request",
        message: "The notary request could not be approved. Please try again.",
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
      title="Approve Notary Request"
      centered
      transitionProps={{ transition: "pop" }}
      size="xl"
      withCloseButton={!isApproving}
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching notary request data...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Table variant="vertical" layout="fixed">
            <Table.Tbody>
              <Table.Tr>
                <Table.Th w={160}>Requestor</Table.Th>
                <Table.Td>
                  <Text c="green" fw={600} size="sm">
                    {notaryRequestData?.requestor.fullname}
                  </Text>
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Td>
                  <Text c="green" fw={600} size="sm">
                    {notaryRequestData?.requestor.email}
                  </Text>
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Status</Table.Th>
                <Table.Td>{getNotaryStatus(notaryRequestData.status)}</Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Uploaded At</Table.Th>
                <Table.Td>
                  <Text c="green" fw={600} size="sm">
                    {getDateFormatDisplay(
                      notaryRequestData?.createdAt || "",
                      true
                    )}
                  </Text>
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>
                  <Text c="green" size="sm">
                    Description
                  </Text>
                </Table.Th>
                <Table.Td>{notaryRequestData?.description}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>

          <Divider label="Upload approval document" />

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
              Approve Request
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
