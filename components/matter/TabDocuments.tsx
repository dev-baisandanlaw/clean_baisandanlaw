import {
  ActionIcon,
  Button,
  Card,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import { Matter } from "@/types/case";
import { getMimeTypeIcon } from "@/utils/getMimeTypeIcon";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  IconCirclePlus,
  IconFileDownload,
  IconTrash,
} from "@tabler/icons-react";
import TabDocumentDeleteFileModal from "./modals/TabDocumentDeleteFileModal";
import { useDisclosure } from "@mantine/hooks";
import React, { useState, useMemo } from "react";
import TabDocumentsUploadFileModal from "./modals/TabDocumentsUploadFileModal";
import EmptyTableComponent from "../EmptyTableComponent";
import axios from "axios";
import { appNotifications } from "@/utils/notifications/notifications";

interface MatterTabDocumentsProps {
  matterData: Matter;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabDocuments({
  matterData,
  setDataChanged,
}: MatterTabDocumentsProps) {
  const [selectedDocument, setSelectedDocument] =
    useState<Matter["documents"][number]>();

  const [
    isDeleteModalFileOpen,
    { open: openDeleteModalFile, close: closeDeleteModalFile },
  ] = useDisclosure(false);

  const [
    isUploadModalFileOpen,
    { open: openUploadModalFile, close: closeUploadModalFile },
  ] = useDisclosure(false);

  const [activeTab, setActiveTab] = useState<string>("all");

  // Filter documents based on active tab
  const filteredDocuments = useMemo(() => {
    if (!matterData.documents) return [];

    switch (activeTab) {
      case "images":
        return matterData.documents.filter((doc) =>
          doc.mimeType.startsWith("image/")
        );
      case "pdfs":
        return matterData.documents.filter(
          (doc) => doc.mimeType === "application/pdf"
        );
      case "all":
      default:
        return matterData.documents;
    }
  }, [matterData.documents, activeTab]);

  const handleDownload = async (fileId: string) => {
    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const res = await axios.get(`/api/google/drive/download/${fileId}`, {
        responseType: "blob",
      });
      const disposition = res.headers["content-disposition"];
      const filenameMatch = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );

      let filename = "download";
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
        try {
          filename = decodeURIComponent(filename);
        } catch {
          /* Empty */
        }
      } // Create and trigger download

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      appNotifications.error({
        title: "Failed to download file",
        message: "The file could not be downloaded. Please try again.",
      });
    }
  };

  return (
    <>
      <Flex direction="column" gap="md">
        <SimpleGrid cols={1}>
          <Card withBorder radius="md" p="md">
            <Card.Section inheritPadding py="xs">
              <Group justify="space-between">
                <Text size="lg" fw={600} c="green">
                  Documents
                </Text>

                <Button
                  leftSection={<IconCirclePlus />}
                  size="xs"
                  variant="outline"
                  onClick={openUploadModalFile}
                >
                  Upload
                </Button>
              </Group>
            </Card.Section>

            <Table variant="vertical" layout="fixed">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th w={160}>Total Files</Table.Th>
                  <Table.Td>
                    <Text c="green" fw={600} size="sm">
                      {matterData.documents?.length || 0}
                    </Text>
                  </Table.Td>
                </Table.Tr>

                <Table.Tr>
                  <Table.Th>Total Size</Table.Th>
                  <Table.Td>
                    <Text c="green" fw={600} size="sm">
                      {matterData.documents
                        ?.reduce((sum, doc) => sum + (doc.sizeInMb || 0), 0)
                        .toFixed(2) || 0}
                      MB
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Card>
        </SimpleGrid>

        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || "all")}
        >
          <Tabs.List>
            <Tabs.Tab value="all">
              All ({matterData.documents?.length || 0})
            </Tabs.Tab>
            <Tabs.Tab value="images">
              Images (
              {matterData.documents?.filter((doc) =>
                doc.mimeType.startsWith("image/")
              ).length || 0}
              )
            </Tabs.Tab>
            <Tabs.Tab value="pdfs">
              PDFs (
              {matterData.documents?.filter(
                (doc) => doc.mimeType === "application/pdf"
              ).length || 0}
              )
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <TableScrollContainer minWidth={500} h={"calc(100vh - 380px)"}>
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Upload Details</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {filteredDocuments.length > 0 &&
                filteredDocuments.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Tooltip label={doc?.name || "-"} position="top">
                        <Text truncate maw="200px" size="sm" fw={600} c="green">
                          {doc?.name || "-"}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} c="green">
                        {doc.sizeInMb.toFixed(2)} MB
                      </Text>
                    </Table.Td>
                    <Table.Td>{getMimeTypeIcon(doc.mimeType)}</Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={600} c="green">
                          {doc.uploadedBy?.fullname || "-"}
                        </Text>
                        <Text size="xs" c="black" opacity={0.8}>
                          {getDateFormatDisplay(doc.uploadedAt, true)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => handleDownload(doc.googleDriveId)}
                        >
                          <IconFileDownload size={24} />
                        </ActionIcon>

                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="red"
                          onClick={() => {
                            setSelectedDocument(doc);
                            openDeleteModalFile();
                          }}
                        >
                          <IconTrash />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}

              {filteredDocuments.length === 0 && (
                <EmptyTableComponent colspan={5} />
              )}
            </Table.Tbody>
          </Table>
        </TableScrollContainer>
      </Flex>

      <TabDocumentsUploadFileModal
        googleDriveFolderId={matterData.googleDriveFolderId}
        opened={isUploadModalFileOpen}
        onClose={closeUploadModalFile}
        matterId={matterData.id!}
        setDataChanged={setDataChanged}
      />

      <TabDocumentDeleteFileModal
        opened={isDeleteModalFileOpen}
        onClose={closeDeleteModalFile}
        document={selectedDocument}
        matterData={matterData}
        setDataChanged={setDataChanged}
      />
    </>
  );
}
