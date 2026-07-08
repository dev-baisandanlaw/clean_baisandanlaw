import {
  ActionIcon,
  Drawer,
  Group,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";

interface AppDrawerProps {
  opened: boolean;
  onClose: () => void;
  title: string;

  children: React.ReactNode;
}
export default function AppDrawer({
  opened,
  onClose,
  title,
  children,
}: AppDrawerProps) {
  const theme = useMantineTheme();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group wrap="nowrap" justify="space-between">
          <Text fw={600} c={theme.colors.green[0]}>
            {title}
          </Text>

          <ActionIcon
            variant="transparent"
            color="white"
            size="sm"
            onClick={onClose}
          >
            <IconX />
          </ActionIcon>
        </Group>
      }
      position="right"
      styles={{
        header: { background: theme.colors.green[7] },
        title: { flex: 1 },
        body: { paddingTop: 12 },
      }}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
    >
      <ScrollArea.Autosize h="calc(100vh - 90px)" mih={600} offsetScrollbars>
        {children}
      </ScrollArea.Autosize>
    </Drawer>
  );
}
