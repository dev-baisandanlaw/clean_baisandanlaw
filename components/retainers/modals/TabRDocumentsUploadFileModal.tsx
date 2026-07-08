import { Button, Group } from "@mantine/core";
import { useEffect, useState } from "react";

import { appNotifications } from "@/utils/notifications/notifications";
import { useUploadRetainerDocumentsMutation } from "@/store/services/retainerService";
import AppModal from "@/components/Common/modal/AppModal";
import MultiFileUploadComp from "@/components/Common/MultiFileUploadComp";

interface TabRDocumentsUploadFileModalProps {
  opened: boolean;
  onClose: () => void;
  retainerId: string;
}

export default function TabRDocumentsUploadFileModal({
  opened,
  onClose,
  retainerId,
}: TabRDocumentsUploadFileModalProps) {
  const [uploadRetainerDocumentsFn, { isLoading: isUploadingDocument }] =
    useUploadRetainerDocumentsMutation();

  const [files, setFiles] = useState<File[]>([]);

  const handleUploadFiles = async () => {
    uploadRetainerDocumentsFn({ id: retainerId, files: Array.from(files) })
      .unwrap()
      .then(({ failedUploads, successfulUploads }) => {
        if (successfulUploads <= 0) {
          appNotifications.error({
            title: "Failed to upload files",
            message: "All files failed to upload",
          });
          return;
        }

        if (successfulUploads === files.length) {
          appNotifications.success({
            title: "Files uploaded successfully",
            message: "All files were uploaded successfully",
          });
          onClose();
          return;
        }

        if (successfulUploads > 0 && failedUploads > 0) {
          appNotifications.success({
            title: "Some files uploaded successfully",
            message: `Only ${successfulUploads} file(s) were uploaded successfully`,
          });
          onClose();
        }
      })
      .catch(() => {
        appNotifications.success({
          title: "Failed to upload files",
          message: "All files failed to upload",
        });
      });
  };

  useEffect(() => {
    if (!opened) {
      setFiles([]);
    }
  }, [opened]);

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      size="xl"
      title="Upload Document"
      closable={!isUploadingDocument}
      type="success"
    >
      <MultiFileUploadComp
        files={files}
        setFiles={setFiles}
        acceptImage
        acceptPdf
        maxFiles={5}
        disabled={isUploadingDocument}
      />

      <Group justify="flex-end" mt="xl">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isUploadingDocument}
        >
          Cancel
        </Button>
        <Button
          disabled={files.length === 0}
          onClick={handleUploadFiles}
          loading={isUploadingDocument}
        >
          Upload
        </Button>
      </Group>
    </AppModal>
  );
}
