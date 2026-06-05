import {
  ActionIcon,
  Button,
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
import { Matter } from "@/types/matter";
import { Document } from "@/types/document";
import BasicCard from "../Common/BasicCard";
import DetailField from "../Common/DetailField";

interface MatterTabDocumentsProps {
  matterData: Matter;
}

export default function TabDocuments({ matterData }: MatterTabDocumentsProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document>();

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
          doc.mimeType.startsWith("image/"),
        );
      case "pdfs":
        return matterData.documents.filter(
          (doc) => doc.mimeType === "application/pdf",
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
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
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
        <BasicCard
          title="Documents"
          actionButton={
            <Button
              leftSection={<IconCirclePlus />}
              size="xs"
              variant="outline"
              onClick={openUploadModalFile}
            >
              Upload
            </Button>
          }
        >
          <SimpleGrid cols={{ base: 2, xs: 2, sm: 4, md: 4 }}>
            <DetailField
              title="Files"
              value={matterData.documents?.length || 0}
            />

            <DetailField
              title="Size"
              value={`${
                matterData?.documents?.reduce(
                  (sum, doc) => sum + Number(doc.sizeInMb || 0),
                  0,
                ) || 0
              } MB`}
            />

            <DetailField
              title="Images"
              value={
                matterData.documents?.filter((doc) =>
                  doc.mimeType.startsWith("image/"),
                ).length || 0
              }
            />

            <DetailField
              title="PDFs"
              value={
                matterData.documents?.filter(
                  (doc) => doc.mimeType === "application/pdf",
                ).length || 0
              }
            />
          </SimpleGrid>
        </BasicCard>

        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || "all")}
        >
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="images">Images</Tabs.Tab>
            <Tabs.Tab value="pdfs">PDFs</Tabs.Tab>
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
                        {doc.sizeInMb} MB
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
        opened={isUploadModalFileOpen}
        onClose={closeUploadModalFile}
        matterId={matterData.id!}
      />

      <TabDocumentDeleteFileModal
        opened={isDeleteModalFileOpen}
        onClose={closeDeleteModalFile}
        document={selectedDocument}
      />
    </>
  );
}
