import {
  ActionIcon,
  Group,
  Modal,
  ModalProps,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { ReactNode } from "react";

interface AppModalProps extends ModalProps {
  title: string;
  children: ReactNode;
  type: "success" | "danger" | "secondary";
  closable?: boolean;
}
export default function AppModal({
  title,
  children,
  type = "success",
  closable = false,
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
      transitionProps={{ transition: "fade-down" }}
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

          {closable && (
            <ActionIcon
              variant="transparent"
              color="white"
              size="sm"
              onClick={props.onClose}
            >
              <IconX />
            </ActionIcon>
          )}
        </Group>
      }
      {...props}
    >
      <ScrollArea.Autosize mah="calc(100vh - 165px)" offsetScrollbars>
        {children}
      </ScrollArea.Autosize>
    </Modal>
  );
}
