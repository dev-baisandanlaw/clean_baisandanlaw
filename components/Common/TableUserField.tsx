import { Stack, Text } from "@mantine/core";

export default function TableUserField({
  title,
  subTitle,
}: {
  title: string;
  subTitle: string | number | undefined;
}) {
  return (
    <Stack gap="0">
      <Text size="sm" c="green" fw={600}>
        {title}
      </Text>
      {typeof subTitle === "string" ||
      typeof subTitle === "number" ||
      !subTitle ? (
        <Text size="xs" c="dimmed" truncate maw={250}>
          {subTitle || "-"}
        </Text>
      ) : (
        subTitle
      )}
    </Stack>
  );
}
