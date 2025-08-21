import { appwriteDeleteFile } from "@/app/api/appwrite";
import { Matter } from "@/types/case";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface TabDocumentDeleteFileModalProps {
  opened: boolean;
  onClose: () => void;
  document?: Matter["documents"][number];
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
  matterId: string;
}

export default function TabDocumentDeleteFileModal({
  opened,
  onClose,
  document,
  setDataChanged,
  matterId,
}: TabDocumentDeleteFileModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFile = async () => {
    setIsDeleting(true);

    try {
      await appwriteDeleteFile(document!.id, matterId);
      toast.success("Document deleted successfully");
      setDataChanged((prev) => !prev);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!opened) setIsDeleting(false);
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Document"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isDeleting}
    >
      <Text ta="center" mb="md">
        Are you sure? This will remove the document from the case and cannot be
        undone.
      </Text>

      <Button
        onClick={handleDeleteFile}
        loading={isDeleting}
        color="red"
        fullWidth
        leftSection={<IconTrash />}
      >
        I Understand
      </Button>
    </Modal>
  );
}
