import { appNotifications } from "@/utils/notifications/notifications";
import { Document } from "@/types/document";
import { useDeleteRetainerDocumentMutation } from "@/store/services/retainerService";
import DeleteModal from "@/components/Common/modal/DeleteModal";

interface TabRDocumentsDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  document?: Document;
}

export default function TabRDocumentsDeleteModal({
  opened,
  onClose,
  document,
}: TabRDocumentsDeleteModalProps) {
  const [deleteRetainerDocumentFn, { isLoading: isDeletingDocument }] =
    useDeleteRetainerDocumentMutation();

  const handleDeleteFile = async () => {
    deleteRetainerDocumentFn({
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
