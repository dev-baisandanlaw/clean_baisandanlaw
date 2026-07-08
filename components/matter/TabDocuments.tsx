import { Button, em, Flex, SimpleGrid, Tabs } from "@mantine/core";
import { IconFileUpload } from "@tabler/icons-react";
import TabDocumentDeleteFileModal from "./modals/TabDocumentDeleteFileModal";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import React, { useState, useMemo } from "react";
import TabDocumentsUploadFileModal from "./modals/TabDocumentsUploadFileModal";
import { appNotifications } from "@/utils/notifications/notifications";
import { Matter } from "@/types/matter";
import { Document } from "@/types/document";
import BasicCard from "../Common/BasicCard";
import DetailField from "../Common/DetailField";
import { useUser } from "@clerk/nextjs";
import DataTableNoPagination from "../data-table/DataTableNoPagination";
import { createMatterDocumentColumns } from "../data-table/columns-no-pagination/MatterDocumentsColumn";
import { useDownloadDocumentMutation } from "@/store/services/documentService";

interface MatterTabDocumentsProps {
  matterData: Matter;
}

export default function TabDocuments({ matterData }: MatterTabDocumentsProps) {
  const { user } = useUser();
  const shrink = useMediaQuery(`(max-width: ${em(768)})`);

  const [downloadDocument] = useDownloadDocumentMutation();
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
      const file = await downloadDocument({
        fileId,
        source: "matters",
      }).unwrap();
      const a = document.createElement("a");

      a.href = file.objectUrl;
      a.download = file.filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(file.objectUrl);
      }, 1000);
    } catch {
      appNotifications.error({
        title: "Failed to download file",
        message: "The file could not be downloaded. Please try again.",
      });
    }
  };

  const canDelete = (doc: Document) => {
    if (!user) return false;

    return (
      user.unsafeMetadata?.role !== "client" || user.id === doc.uploadedBy.id
    );
  };

  const columns = useMemo(
    () =>
      createMatterDocumentColumns({
        onDownload: handleDownload,
        onDelete: (doc) => {
          setSelectedDocument(doc);
          openDeleteModalFile();
        },
        canDelete,
        userId: user?.id,
        userRole: user?.unsafeMetadata?.role as string,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  return (
    <>
      <Flex direction="column" gap="md" style={{ minWidth: 0 }}>
        <BasicCard
          title="Documents"
          actionButton={
            <Button
              leftSection={<IconFileUpload size={16} />}
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
              value={matterData.documents?.length || "0"}
            />

            <DetailField
              title="Size"
              value={`${
                matterData?.documents
                  ?.reduce((sum, doc) => sum + Number(doc.sizeInMb || 0), 0)
                  .toFixed(2) || "0"
              } MB`}
            />

            <DetailField
              title="Images"
              value={
                matterData.documents?.filter((doc) =>
                  doc.mimeType.startsWith("image/"),
                ).length || "0"
              }
            />

            <DetailField
              title="PDFs"
              value={
                matterData.documents?.filter(
                  (doc) => doc.mimeType === "application/pdf",
                ).length || "0"
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

        <DataTableNoPagination
          columns={columns}
          data={filteredDocuments}
          emptyText="No documents found"
          maxHeight={shrink ? "100%" : "calc(100vh - 380px)"}
        />
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
