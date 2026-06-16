import {
  ActionIcon,
  Group,
  Modal,
  ModalProps,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { ReactNode } from "react";

interface AppModalProps extends ModalProps {
  title: string;
  children: ReactNode;
  type: "success" | "danger" | "secondary";
}
export default function AppModal({
  title,
  children,
  type = "success",
  ...props
}: AppModalProps) {
  const theme = useMantineTheme();

  const getColorTheme = () => {
    if (type === "success") {
      return { bg: theme.colors.green[9], font: theme.colors.green[0] };
    }

    if (type === "danger") {
      return { bg: theme.colors.red[8], font: theme.colors.red[0] };
    }

    if (type === "secondary") {
      return { bg: theme.other.customPumpkin, font: "#936514" };
    }
  };

  return (
    <Modal
      centered
      closeOnClickOutside={false}
      withCloseButton={false}
      transitionProps={{ transition: "pop" }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 2,
      }}
      styles={{
        header: {
          background: getColorTheme()?.bg,
          paddingBlock: 2,
          width: "100%",
        },
        title: { flex: 1 },
        body: { paddingTop: 16 },
      }}
      title={
        <Group wrap="nowrap" justify="space-between">
          <Text fw={600} c={getColorTheme()?.font}>
            {title}
          </Text>

          <ActionIcon variant="transparent" color="white" size="sm">
            <IconX />
          </ActionIcon>
        </Group>
      }
      {...props}
    >
      {children}
    </Modal>
  );
}
