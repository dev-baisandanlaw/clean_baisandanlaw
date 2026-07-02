import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function AuthErrorAlert({ title }: { title: string }) {
  if (!title) return null;

  return (
    <Alert
      title={title}
      color="red.9"
      icon={<IconAlertCircle />}
      styles={{
        icon: { marginBlock: "auto" },
        title: { fontSize: "12px" },
      }}
      mb={16}
    />
  );
}
