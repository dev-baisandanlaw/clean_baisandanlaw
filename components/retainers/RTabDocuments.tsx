import { Button, Flex, ScrollArea, SimpleGrid, Tabs } from "@mantine/core";
import { IconFileUpload } from "@tabler/icons-react";
import TabRDocumentsDeleteModal from "./modals/TabRDocumentsDeleteModal";
import { useDisclosure } from "@mantine/hooks";
import { useState, useMemo } from "react";
import TabRDocumentsUploadFileModal from "./modals/TabRDocumentsUploadFileModal";
import { appNotifications } from "@/utils/notifications/notifications";
import { Retainer } from "@/types/retainer-new";
import { Document } from "@/types/document";
import BasicCard from "../Common/BasicCard";
import DetailField from "../Common/DetailField";
import { useUser } from "@clerk/nextjs";
import { createRetainerDocumentColumns } from "../data-table/columns-no-pagination/RetainerDocumentsColumn";
import DataTableNoPagination from "../data-table/DataTableNoPagination";
import { useDownloadDocumentMutation } from "@/store/services/documentService";

interface RTabDocumentsProps {
  retainerData: Retainer;
}

export default function RTabDocuments({ retainerData }: RTabDocumentsProps) {
  const { user } = useUser();
  const [downloadDocument] = useDownloadDocumentMutation();
  const [selectedDocument, setSelectedDocument] = useState<Document>();
  const [activeTab, setActiveTab] = useState<string>("all");

  const [
    isDeleteModalFileOpen,
    { open: openDeleteModalFile, close: closeDeleteModalFile },
  ] = useDisclosure(false);

  const [
    isUploadModalFileOpen,
    { open: openUploadModalFile, close: closeUploadModalFile },
  ] = useDisclosure(false);

  const filteredDocuments = useMemo(() => {
    if (!retainerData.documents) return [];

    switch (activeTab) {
      case "images":
        return retainerData.documents.filter((doc) =>
          doc.mimeType.startsWith("image/"),
        );
      case "pdfs":
        return retainerData.documents.filter(
          (doc) => doc.mimeType === "application/pdf",
        );
      case "all":
      default:
        return retainerData.documents;
    }
  }, [retainerData.documents, activeTab]);

  const handleDownload = async (fileId: string) => {
    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const file = await downloadDocument({
        fileId,
        source: "retainers",
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
      createRetainerDocumentColumns({
        onDownload: handleDownload,
        onDelete: (doc) => {
          setSelectedDocument(doc);
          openDeleteModalFile();
        },
        canDelete,
        userId: user?.id,
        userRole: user?.unsafeMetadata?.role as string | undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, openDeleteModalFile],
  );

  return (
    <>
      <ScrollArea.Autosize offsetScrollbars>
        <Flex direction="column" gap="md">
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
                value={retainerData.documents?.length || "0"}
              />
              <DetailField
                title="Size"
                value={`${
                  retainerData?.documents
                    ?.reduce((sum, doc) => sum + Number(doc.sizeInMb || 0), 0)
                    .toFixed(2) || "0"
                } MB`}
              />
              <DetailField
                title="Images"
                value={
                  retainerData.documents?.filter((doc) =>
                    doc.mimeType.startsWith("image/"),
                  ).length || "0"
                }
              />
              <DetailField
                title="PDFs"
                value={
                  retainerData.documents?.filter(
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
            emptyText="No documents found."
            maxHeight="calc(100vh - 380px)"
          />
        </Flex>
      </ScrollArea.Autosize>

      <TabRDocumentsUploadFileModal
        opened={isUploadModalFileOpen}
        onClose={closeUploadModalFile}
        retainerId={retainerData.id}
      />

      <TabRDocumentsDeleteModal
        opened={isDeleteModalFileOpen}
        onClose={closeDeleteModalFile}
        document={selectedDocument}
      />
    </>
  );
}
