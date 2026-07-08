import BasicCard from "@/components/Common/BasicCard";
import AppModal from "@/components/Common/modal/AppModal";
import MultiFileUploadComp from "@/components/Common/MultiFileUploadComp";
import SpoilerComp from "@/components/Common/SpoilerComp";
import {
  useLazyGetClientRequestByIdQuery,
  useUploadClientRequestFinishedDocumentMutation,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface AdminFinishedFileUploadModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

export default function AdminFinishedFileUploadModal({
  opened,
  onClose,
  clientRequestId,
}: AdminFinishedFileUploadModalProps) {
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();

  const [uploadFinishedDocumentFn, { isLoading: isUploading }] =
    useUploadClientRequestFinishedDocumentMutation();

  const [files, setFiles] = useState<File[]>([]);

  const resetForm = useCallback(() => {
    setFiles([]);
  }, []);

  useEffect(() => {
    if (!opened || !clientRequestId) {
      resetForm();
      return;
    }

    getClientRequestById(clientRequestId);
  }, [clientRequestId, getClientRequestById, opened, resetForm]);

  const handleClose = useCallback(() => {
    if (isUploading) return;

    resetForm();
    onClose();
  }, [isUploading, onClose, resetForm]);

  const handleSubmit = async () => {
    if (!clientRequestId || files.length === 0) return;

    try {
      await uploadFinishedDocumentFn({
        id: clientRequestId,
        file: files[0],
      }).unwrap();

      appNotifications.success({
        title: "Finished document uploaded",
        message: "The document has been sent for client review.",
      });
      handleClose();
    } catch {
      appNotifications.error({
        title: "Failed to upload document",
        message: "Please check the file and try again.",
      });
    }
  };

  const isLoadingDetails = isLoading || isFetching;

  return (
    <AppModal
      opened={opened}
      onClose={handleClose}
      title="Upload finished document"
      type="success"
      size="lg"
      closable={!isUploading}
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          <Alert
            color="blue"
            variant="light"
            icon={<IconInfoCircle />}
            title="Finished Document"
          >
            <Text size="sm">
              Upload the completed document for the client to review.
            </Text>
          </Alert>

          <BasicCard title="Description">
            <SpoilerComp>{clientRequestData.description}</SpoilerComp>
          </BasicCard>

          <MultiFileUploadComp
            files={files}
            setFiles={setFiles}
            acceptPdf
            maxFiles={1}
            disabled={isUploading}
          />

          <Group justify="end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              color="green.7"
              disabled={!clientRequestId || files.length === 0 || isUploading}
              loading={isUploading}
              onClick={handleSubmit}
            >
              Upload Finished Document
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
