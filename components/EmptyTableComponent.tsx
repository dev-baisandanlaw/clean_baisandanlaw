import { Image, Stack, Table, Text } from "@mantine/core";
import emptyTable from "@/public/images/no-results.png";

interface EmptyTableComponentProps {
  colspan: number;
  message?: string;
}

export default function EmptyTableComponent({
  colspan,
  message,
}: EmptyTableComponentProps) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colspan} h={300}>
        <Stack align="center" justify="center" h="100%">
          <Image
            src={emptyTable.src}
            alt="empty table"
            fit="contain"
            h={100}
            w="auto"
          />
          <Text size="xl">{message || "No records found"}</Text>
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
