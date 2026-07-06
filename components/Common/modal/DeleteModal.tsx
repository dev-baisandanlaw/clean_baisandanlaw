import { Button, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";
import { ReactNode, useState } from "react";
import AppModal from "./AppModal";

interface DeleteModalProps {
  handleDelete: () => Promise<void> | void;
  handleSuccessCallback?: () => void;

  opened: boolean;
  onClose: () => void;

  title?: string;
  action?: string;
  entityType?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: ReactNode;
  confirmDisabled?: boolean;
  isLoading?: boolean;
}
export default function DeleteModal({
  handleDelete,
  handleSuccessCallback,

  opened,
  onClose,

  title = "Delete Record",
  action = "delete",
  entityType = "record",
  confirmLabel = "I Understand",
  cancelLabel = "Cancel",
  confirmIcon = <IconTrash />,
  confirmDisabled = false,
  isLoading,
}: DeleteModalProps) {
  const [internalIsDeleting, setInternalIsDeleting] = useState(false);
  const isDeleting = isLoading ?? internalIsDeleting;

  const handleClickDelete = async () => {
    setInternalIsDeleting(true);

    try {
      await handleDelete();

      if (handleSuccessCallback) handleSuccessCallback();
    } finally {
      setInternalIsDeleting(false);
    }
  };

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title={title}
      type="danger"
      closable={!isDeleting}
      size="md"
    >
      <Stack align="center" gap="2">
        <ThemeIcon variant="light" color="red" radius="50%" size={60}>
          <IconAlertTriangle size={32} />
        </ThemeIcon>
        <Text size="lg" fw={600}>
          Are you sure?
        </Text>

        <Text ta="center" my="xs">
          This action will {action} the {entityType}. <br />
          You won&apos;t be able to revert this!
        </Text>
      </Stack>

      <Group grow mt="md">
        <Button
          variant="default"
          onClick={onClose}
          disabled={isDeleting}
          size="sm"
        >
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          onClick={handleClickDelete}
          loading={isDeleting}
          disabled={confirmDisabled}
          color="red.7"
          leftSection={confirmIcon}
        >
          {confirmLabel}
        </Button>
      </Group>
    </AppModal>
  );
}
