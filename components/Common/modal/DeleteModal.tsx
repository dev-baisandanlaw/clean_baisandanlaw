import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

interface DeleteModalProps {
  handleDelete: () => Promise<void>;
  handleSuccessCallback?: () => void;

  opened: boolean;
  onClose: () => void;

  title?: string;
  deleteText: string;
  children?: ReactNode;
}
export default function DeleteModal({
  handleDelete,
  handleSuccessCallback,

  opened,
  onClose,

  title = "Delete Record",
  deleteText,
  children,
}: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClickDelete = async () => {
    setIsDeleting(true);

    await handleDelete();

    if (handleSuccessCallback) handleSuccessCallback();

    setIsDeleting(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      withCloseButton={!isDeleting}
      centered
    >
      <Text ta="center" mb="md">
        {deleteText}
      </Text>

      {children}

      <Button
        onClick={handleClickDelete}
        loading={isDeleting}
        color="red"
        fullWidth
        leftSection={<IconTrash />}
        size="sm"
        mt="md"
      >
        I Understand
      </Button>
    </Modal>
  );
}
