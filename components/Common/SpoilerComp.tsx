import { Group, Spoiler, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

const SpoilerComp = ({ children }: { children: React.ReactNode }) => {
  return (
    <Spoiler
      maxHeight={75}
      showLabel={
        <Group gap="4">
          <Text size="sm">Show more</Text>
          <IconChevronDown size={12} />
        </Group>
      }
      hideLabel={
        <Group gap="4">
          <Text size="sm">Show less</Text>
          <IconChevronUp size={12} />
        </Group>
      }
      style={{ whiteSpace: "pre-wrap" }}
      styles={{
        control: { color: "var(--mantine-color-blue-9)" },
        content: { fontSize: "14px" },
      }}
    >
      {children}
    </Spoiler>
  );
};

export default SpoilerComp;
