import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Retainer } from "@/types/retainer";
import { appNotifications } from "@/utils/notifications/notifications";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";

interface TabRDocumentsDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  file: Retainer["documents"][number];
  retainer: Retainer;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabRDocumentsDeleteModal({
  opened,
  onClose,
  file,
  retainer,
  setDataChanged,
}: TabRDocumentsDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await axios.delete(`/api/google/drive/delete/${file.googleDriveId}`);
      await setDoc(
        doc(db, COLLECTIONS.RETAINERS, retainer.id),
        {
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          documents: retainer.documents.filter((d) => d.id !== file.id),
        },
        { merge: true }
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "File deleted successfully",
        message: "The file has been deleted successfully",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to delete file",
        message: "The file could not be deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!file || !retainer) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Document"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isDeleting}
    >
      <Text mb="md">
        Are you sure you want to delete <strong>{file.name}</strong>? Once
        confirmed, the document will be deleted and cannot be undone.
      </Text>

      <Button
        onClick={handleDelete}
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
