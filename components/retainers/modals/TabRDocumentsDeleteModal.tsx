import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Retainer } from "@/types/retainer";
import { Button, Modal, Stack, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";

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
      toast.success("File deleted successfully");
      onClose();
    } catch {
      toast.error("Failed to delete file");
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
      <Stack>
        <Text>
          Are you sure you want to delete <strong>{file.name}</strong>? Once
          confirmed, the document will be deleted and cannot be undone.
        </Text>
      </Stack>

      <Button
        onClick={handleDelete}
        loading={isDeleting}
        color="red"
        fullWidth
        leftSection={<IconTrash />}
        mt="md"
      >
        I Understand
      </Button>
    </Modal>
  );
}
