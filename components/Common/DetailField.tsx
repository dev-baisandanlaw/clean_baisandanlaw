import { Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

export default function DetailField({
  title,
  value,
}: {
  title: string;
  value: string | number | ReactNode | undefined;
}) {
  return (
    <Stack gap="2">
      <Text size="sm" c="dimmed">
        {title}
      </Text>
      {typeof value === "string" || typeof value === "number" || !value ? (
        <Text
          size="sm"
          c="black"
          style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
        >
          {value || "-"}
        </Text>
      ) : (
        value
      )}
    </Stack>
  );
}
