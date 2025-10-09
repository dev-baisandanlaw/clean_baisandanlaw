import { appwriteDeleteFile } from "@/app/api/appwrite";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import { MatterUpdateType } from "@/types/matter-updates";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { useUser } from "@clerk/nextjs";

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
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFile = async () => {
    setIsDeleting(true);

    try {
      const ref = doc(db, COLLECTIONS.CASES, matterId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Firebase cannot find the document");

      const currentDocs = snap.data()?.documents || [];
      const updatedDocs = currentDocs.filter(
        (doc: { id: string }) => doc.id !== document!.id
      );

      await appwriteDeleteFile(document!.id);
      await updateDoc(ref, { documents: updatedDocs });
      await addMatterUpdate(
        user!,
        matterId,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.DOCUMENT,
        `Document deleted`
      );

      setDataChanged((prev) => !prev);
      toast.success("Document deleted successfully");
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
