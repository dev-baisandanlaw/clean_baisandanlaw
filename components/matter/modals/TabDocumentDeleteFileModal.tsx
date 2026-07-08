import { appNotifications } from "@/utils/notifications/notifications";
import { Document } from "@/types/document";
import { useDeleteMatterDocumentMutation } from "@/store/services/matterService";
import DeleteModal from "@/components/Common/modal/DeleteModal";

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
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Delete Document"
      action="delete"
      entityType="document"
      handleDelete={handleDeleteFile}
      isLoading={isDeletingDocument}
    />
  );
}
