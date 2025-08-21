import { Matter } from "@/types/case";
import { Attorney, Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  Badge,
  Card,
  Flex,
  Group,
  Paper,
  SimpleGrid,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";

interface MatterTabOverviewProps {
  matterData: Matter;
  clientData: Client;
  attorneyData: Attorney;
}

interface VerticalTableProps {
  title: string;
  data: {
    th: string;
    td: React.ReactNode;
  }[];
}

export default function TabOverview({
  matterData,
  clientData,
  attorneyData,
}: MatterTabOverviewProps) {
  const theme = useMantineTheme();

  const caseDetailsCardData = [
    {
      th: "Case Number",
      td: (
        <Text c="green" fw={600} size="sm">
          {matterData.caseNumber}
        </Text>
      ),
    },
    {
      th: "Case Type",
      td: (
        <Group gap={2}>
          {matterData.caseType.map((type) => (
            <Badge
              key={type}
              color={theme.other.customPumpkin}
              size="xs"
              radius="xs"
              variant="outline"
            >
              {type}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      th: "Date Created",
      td: getDateFormatDisplay(matterData.createdAt),
    },
    {
      th: "Status",
      td: (
        <Badge
          color={matterData.status === "active" ? "green" : "red"}
          size="xs"
          radius="xs"
        >
          {matterData.status}
        </Badge>
      ),
    },
  ];

  const clientDetailsCardData = [
    {
      th: "Name",
      td: (
        <Text c="green" fw={600} size="sm">
          {matterData.clientData.fullname}
        </Text>
      ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {clientData.email_addresses[0].email_address}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: clientData.unsafe_metadata?.phoneNumber || "-",
    },
    {
      th: "Subscription",
      td: (
        <Badge
          size="xs"
          radius="xs"
          color={
            clientData.unsafe_metadata?.subscription?.isSubscribed
              ? "green"
              : "blue"
          }
        >
          {clientData.unsafe_metadata?.subscription?.isSubscribed
            ? "Premium"
            : "Free"}
        </Badge>
      ),
    },
  ];

  const attorneyDetailsCardData = [
    {
      th: "Name",
      td: (
        <Text c="green" fw={600} size="sm">
          {attorneyData.first_name + " " + attorneyData.last_name}
        </Text>
      ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {attorneyData.email_addresses[0].email_address}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: clientData.unsafe_metadata?.phoneNumber || "-",
    },
  ];

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={3}>
        <VerticalTable title="Case Details" data={caseDetailsCardData} />
        <VerticalTable title="Client Details" data={clientDetailsCardData} />
        <VerticalTable title="Lead Attorney" data={attorneyDetailsCardData} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Text size="lg" fw={600} mb="sm" c="green">
          Description
        </Text>

        <Text size="sm" mr="xl">
          {matterData.caseDescription || "-"}
        </Text>
      </Paper>
    </Flex>
  );
}

const VerticalTable = ({ title, data = [] }: VerticalTableProps) => (
  <Card withBorder radius="md" p="md">
    <Card.Section inheritPadding py="xs">
      <Text size="lg" fw={600} c="green">
        {title}
      </Text>
    </Card.Section>

    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        {data.map((item, index) => (
          <Table.Tr key={index}>
            <Table.Th w={120}>{item.th}</Table.Th>
            <Table.Td>{item.td}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </Card>
);
