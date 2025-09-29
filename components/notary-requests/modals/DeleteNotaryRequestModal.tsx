import { appwriteDeleteNotaryRequest } from "@/app/api/appwrite";
import { NotaryRequest } from "@/types/notary-requests";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "react-toastify";

interface DeleteNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function DeleteNotaryRequestModal({
  opened,
  onClose,
  notaryRequest,
}: DeleteNotaryRequestModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFile = async () => {
    setIsDeleting(true);
    try {
      await appwriteDeleteNotaryRequest(notaryRequest!.id);
      toast.success("Notary request deleted successfully");
      onClose();
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!notaryRequest) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Notary Request"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isDeleting}
    >
      <Text ta="center" mb="md">
        Are you sure? This will remove the notary request and cannot be undone.
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
