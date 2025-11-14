import { approveNotaryRequest } from "@/firebase/approveNotaryRequest";
import { NotaryRequest } from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus } from "@/utils/getNotaryStatus";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconFileTypePdf, IconUpload, IconX } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";

interface ApproveNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function ApproveNotaryRequestModal({
  opened,
  onClose,
  notaryRequest,
}: ApproveNotaryRequestModalProps) {
  const { user } = useUser();
  const [file, setFile] = useState<(File & { id?: string }) | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (!opened) {
      setFile(null);
    } else {
      if (notaryRequest?.documents?.finishedFile?.id) {
        setFile({
          name: notaryRequest.documents.finishedFile.name,
          id: notaryRequest.documents.finishedFile.id,
        } as unknown as File & { id?: string });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  if (!notaryRequest) return null;

  const handleApproveNotaryRequest = async () => {
    setIsApproving(true);
    let fileId = null;
    try {
      if (file?.size) {
        if (notaryRequest?.documents?.finishedFile?.id) {
          await axios.delete(
            `/api/google/drive/delete/${notaryRequest.documents.finishedFile.id}`
          );
        }

        const fd = new FormData();
        fd.append("parentId", notaryRequest.documents.googleDriveFolderId);
        fd.append("file", file);
        const { data: uploadedFile } = await axios.post(
          "/api/google/drive/upload",
          fd
        );

        fileId = uploadedFile.uploadedFiles.id;
      }

      await approveNotaryRequest(notaryRequest, user!, {
        id: fileId,
        name: file!.name,
      });

      appNotifications.success({
        title: "Notary request approved",
        message: "The notary request has been approved successfully",
      });
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
      <Stack gap="md">
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Requestor</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.fullname}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.email}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Status</Table.Th>
              <Table.Td>{getNotaryStatus(notaryRequest.status)}</Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Uploaded At</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {getDateFormatDisplay(notaryRequest?.createdAt || "", true)}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>
                <Text c="green" size="sm">
                  Description
                </Text>
              </Table.Th>
              <Table.Td>{notaryRequest?.description}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Divider label="Upload approval document" />

        {!file && (
          <Dropzone
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
              <Text c={!!file ? "dimmed" : "green"} fw={600}>
                Drag and drop file here or click to select file
              </Text>
              <Text c={!!file ? "dimmed" : "green"} size="sm">
                Max size: <strong>5MB</strong> - <strong>1 file only</strong>
              </Text>
              <IconUpload size={40} />
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
    </Modal>
  );
}
