import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import { MatterUpdateType } from "@/types/matter-updates";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { appNotifications } from "@/utils/notifications/notifications";

interface TabDocumentDeleteFileModalProps {
  opened: boolean;
  onClose: () => void;
  document?: Matter["documents"][number];
  matterData: Matter;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabDocumentDeleteFileModal({
  opened,
  onClose,
  document,
  matterData,
  setDataChanged,
}: TabDocumentDeleteFileModalProps) {
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFile = async () => {
    setIsDeleting(true);

    try {
      await axios.delete(`/api/google/drive/delete/${document!.googleDriveId}`);
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterData.id),
        {
          documents: matterData.documents.filter((d) => d.id !== document!.id),
        },
        { merge: true }
      );

      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.DOCUMENT,
        `Document Deleted: ${document!.name}`
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Document deleted successfully",
        message: "The document has been deleted successfully",
      });
      onClose();
    } catch (err) {
      appNotifications.error({
        title: "Failed to delete document",
        message:
          err instanceof Error ? err.message : "Failed to delete document",
      });
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
      <Text mb="md">
        Are you sure you want to delete <strong>{document?.name}</strong>? Once
        confirmed, the document will be deleted and cannot be undone.
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
