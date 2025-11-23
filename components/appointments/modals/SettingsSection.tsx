import {
  Card,
  Checkbox,
  Collapse,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface SettingsSectionProps {
  title: string;
  count: string;
  accordionKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  items: Array<{ name: string; date?: string; id?: string; value?: number }>;
  checkedValues?: Record<string, boolean>;
  onCheckboxChange?: (id: string, checked: boolean) => void;
}

export default function SettingsSection({
  title,
  count,
  accordionKey,
  isOpen,
  onToggle,
  items,
  checkedValues,
  onCheckboxChange,
}: SettingsSectionProps) {
  return (
    <Card withBorder radius="md">
      <Card.Section
        p="sm"
        onClick={() => onToggle(accordionKey)}
        style={{ cursor: "pointer" }}
      >
        <Group justify="space-between">
          <Text fw={600} c="green">
            {title}{" "}
            <Text span c="dimmed" size="sm">
              ({count})
            </Text>
          </Text>
          <ThemeIcon variant="white" size="sm" color="black">
            {isOpen ? <IconChevronUp /> : <IconChevronDown />}
          </ThemeIcon>
        </Group>
      </Card.Section>

      <Collapse in={isOpen}>
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 7 }}>
          {items.map((item, index) => {
            // Determine the key: use id for holidays, lowercase name for work schedule, or value as fallback
            const itemKey = item.id
              ? item.id
              : item.name
                ? item.name.toLowerCase()
                : item.value?.toString() || index.toString();

            const isChecked = checkedValues
              ? checkedValues[itemKey] || false
              : false;

            return (
              <Checkbox
                key={index}
                checked={isChecked}
                onChange={(event) => {
                  if (onCheckboxChange) {
                    // Use id for holidays, lowercase name for work schedule
                    const changeKey =
                      item.id ||
                      item.name?.toLowerCase() ||
                      item.value?.toString();
                    if (changeKey) {
                      onCheckboxChange(changeKey, event.currentTarget.checked);
                    }
                  }
                }}
                styles={{
                  body: {
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  },
                  label: { paddingLeft: 0 },
                }}
                label={
                  <Stack gap="0" align="center">
                    <Text size="xs" fw={500} ta="center">
                      {item.name}
                    </Text>
                    {item.date && (
                      <Text size="xs" c="dimmed" ta="center">
                        {item.date}
                      </Text>
                    )}
                  </Stack>
                }
              />
            );
          })}
        </SimpleGrid>
      </Collapse>
    </Card>
  );
}
