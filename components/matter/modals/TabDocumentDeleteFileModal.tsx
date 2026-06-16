import { Button, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { appNotifications } from "@/utils/notifications/notifications";
import { Document } from "@/types/document";
import { useDeleteMatterDocumentMutation } from "@/store/services/matterService";
import AppModal from "@/components/Common/modal/AppModal";

interface TabDocumentDeleteFileModalProps {
  opened: boolean;
  onClose: () => void;
  document?: Document;
}

export default function TabDocumentDeleteFileModal({
  opened,
  onClose,
  document,
}: TabDocumentDeleteFileModalProps) {
  const [deleteMatterDocumentFn, { isLoading: isDeletingDocument }] =
    useDeleteMatterDocumentMutation();

  const handleDeleteFile = async () => {
    deleteMatterDocumentFn({
      id: document!.googleDriveParentFolderId!,
      driveId: document!.googleDriveId!,
    })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Document deleted successfully",
          message: "The document has been deleted successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: "An error occurred",
          message: "Failed to delete document",
        });
      });
  };

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Delete Document"
      closable={!isDeletingDocument}
      type="danger"
    >
      <Text mb="md">
        Are you sure you want to delete <strong>{document?.name}</strong>? Once
        confirmed, the document will be deleted and cannot be undone.
      </Text>

      <Button
        onClick={handleDeleteFile}
        loading={isDeletingDocument}
        color="red.5"
        fullWidth
        leftSection={<IconTrash />}
      >
        I Understand
      </Button>
    </AppModal>
  );
}
