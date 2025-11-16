"use client";

import { Matter } from "@/types/case";
import { Attorney, Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Flex,
  Group,
  Paper,
  SimpleGrid,
  Spoiler,
  Table,
  Text,
  Textarea,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import MatterUpdates from "./TabOverview/MatterUpdates";
import { MatterUpdateDocument, MatterUpdateType } from "@/types/matter-updates";
import { IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { addMatterUpdate } from "./utils/addMatterUpdate";
import { useUser } from "@clerk/nextjs";
import MatterNotes from "./TabOverview/MatterNotes";
import { appNotifications } from "@/utils/notifications/notifications";

interface MatterTabOverviewProps {
  matterData: Matter;
  clientData: Client;
  attorneyData: Attorney;
  matterUpdates: MatterUpdateDocument;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
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
  matterUpdates,
  setDataChanged,
}: MatterTabOverviewProps) {
  const theme = useMantineTheme();
  const { user } = useUser();

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
        <Tooltip
          label={matterData.caseType.join(", ")}
          withArrow
          multiline
          maw={600}
        >
          <Group gap={2}>
            {matterData.caseType.slice(0, 3).map((type) => (
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
            {matterData.caseType.length > 3 && (
              <Badge
                color={theme.other.customPumpkin}
                size="xs"
                radius="xs"
                variant="outline"
              >
                +{matterData.caseType.length - 3}
              </Badge>
            )}
          </Group>
        </Tooltip>
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
              : theme.colors.gray[6]
          }
        >
          {clientData.unsafe_metadata?.subscription?.isSubscribed
            ? "Premium"
            : "Basic"}
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

  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditDescription, setIsEditDescription] = useState(false);
  const [description, setDescription] = useState("");

  const handleUpdateDescription = async () => {
    setIsUpdatingDescription(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterData.id),
        {
          caseDescription: description,
        },
        {
          merge: true,
        }
      );
      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.DESCRIPTION,
        "Description Updated"
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Description updated successfully",
        message: "The description has been updated successfully",
      });
      setIsEditDescription(false);
    } catch {
      appNotifications.error({
        title: "Failed to update description",
        message: "The description could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  useEffect(() => {
    setDescription(matterData?.caseDescription || "");
  }, [matterData]);

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={3}>
        <VerticalTable title="Matter Details" data={caseDetailsCardData} />
        <VerticalTable title="Client Details" data={clientDetailsCardData} />
        <VerticalTable title="Lead Attorney" data={attorneyDetailsCardData} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group align="center" mb="sm" gap={4} justify="space-between">
          <Text size="lg" fw={600} c="green">
            Description
          </Text>

          {!isEditDescription && user?.unsafeMetadata.role !== "client" && (
            <ActionIcon
              variant="white"
              size="sm"
              color={theme.other.customPumpkin}
              onClick={() => setIsEditDescription(true)}
            >
              <IconPencil size={20} />
            </ActionIcon>
          )}

          {isEditDescription && (
            <Group gap={4}>
              <Button
                size="xs"
                variant="default"
                onClick={() => {
                  setIsEditDescription(false);
                  setDescription(matterData.caseDescription || "");
                }}
                disabled={isUpdatingDescription}
              >
                Discard
              </Button>
              <Button
                size="xs"
                loading={isUpdatingDescription}
                onClick={handleUpdateDescription}
                disabled={
                  !description.trim().length ||
                  matterData.caseDescription === description
                }
              >
                Save
              </Button>
            </Group>
          )}
        </Group>

        {isEditDescription ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
          />
        ) : (
          <Spoiler
            maxHeight={80}
            showLabel="Show more"
            hideLabel="Show less"
            styles={{
              control: { fontWeight: 700, color: "#448AFF", fontSize: 14 },
            }}
          >
            <Text size="sm" mr="xl" style={{ whiteSpace: "pre-wrap" }}>
              {matterData.caseDescription || "-"}
            </Text>
          </Spoiler>
        )}
      </Paper>

      <Group grow align="start">
        <MatterUpdates updates={matterUpdates.items} />
        <MatterNotes
          notes={matterData.notes || null}
          matterId={matterData.id}
          setDataChanged={setDataChanged}
        />
      </Group>
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
