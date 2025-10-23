import { Modal } from "@mantine/core";

interface ViewAllModalProps {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export default function ViewAllModal({
  opened,
  onClose,
  children,
  title,
}: ViewAllModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="xl"
      transitionProps={{ transition: "pop" }}
    >
      {children}
    </Modal>
  );
}
