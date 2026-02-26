"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Flex,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Spoiler,
  Table,
  TagsInput,
  Text,
  Textarea,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPencil } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import { doc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import axios from "axios";

import {
  ATTY_PRACTICE_AREAS,
  CLERK_ORG_IDS,
  COLLECTIONS,
} from "@/constants/constants";
import { db } from "@/firebase/config";
import { syncToAppwrite } from "@/lib/syncToAppwrite";
import { appNotifications } from "@/utils/notifications/notifications";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SubscriptionBadge from "../Common/SubscriptionBadge";

import MatterUpdates from "./TabOverview/MatterUpdates";
import MatterNotes from "./TabOverview/MatterNotes";
import { addMatterUpdate } from "./utils/addMatterUpdate";

import { Matter } from "@/types/case";
import { Attorney, Client } from "@/types/user";
import { MatterUpdateDocument, MatterUpdateType } from "@/types/matter-updates";

interface MatterTabOverviewProps {
  matterData: Matter;
  clientData: Client | null;
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
  editButton?: React.ReactNode;
}

export default function TabOverview({
  matterData,
  clientData,
  attorneyData,
  matterUpdates,
  setDataChanged,
}: MatterTabOverviewProps) {
  const shrink = useMediaQuery("(max-width: 948px)");
  const shrinkSmall = useMediaQuery("(max-width: 768px)");
  const theme = useMantineTheme();
  const { user } = useUser();

  const isAdmin = user?.unsafeMetadata?.role === "admin";

  // Matter Details editing state
  const [isEditingMatter, setIsEditingMatter] = useState(false);
  const [isUpdatingMatter, setIsUpdatingMatter] = useState(false);
  const [editedMatter, setEditedMatter] = useState({
    caseType: matterData.caseType,
  });

  // Client editing state
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [editedClientId, setEditedClientId] = useState(
    matterData.clientData.id,
  );
  const [clientUsers, setClientUsers] = useState<Client[]>([]);

  // Attorney editing state
  const [isEditingAttorney, setIsEditingAttorney] = useState(false);
  const [isUpdatingAttorney, setIsUpdatingAttorney] = useState(false);
  const [editedAttorneyId, setEditedAttorneyId] = useState(
    matterData.leadAttorney.id,
  );
  const [attorneyUsers, setAttorneyUsers] = useState<Attorney[]>([]);

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
      td: isEditingMatter ? (
        <TagsInput
          size="xs"
          value={editedMatter.caseType}
          onChange={(value) =>
            setEditedMatter({ ...editedMatter, caseType: value })
          }
          data={ATTY_PRACTICE_AREAS}
          clearable
          maxDropdownHeight={200}
          comboboxProps={{
            transitionProps: { transition: "pop-top-left", duration: 200 },
          }}
          styles={{
            pill: {
              backgroundColor: theme.colors.green[0],
              color: theme.colors.green[9],
            },
          }}
        />
      ) : (
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

  const selectedClientForEdit = isEditingClient
    ? clientUsers.find((u) => u.id === editedClientId)
    : null;

  const clientDetailsCardData = [
    {
      th: "Name",
      td: isEditingClient ? (
        <Select
          size="xs"
          value={editedClientId}
          onChange={(value) => setEditedClientId(value || "")}
          data={clientUsers.map((user) => ({
            value: user.id,
            label: `${user.first_name} ${user.last_name}`,
          }))}
          searchable
          clearable
          nothingFoundMessage="No clients found"
        />
      ) : (
        <Text c="green" fw={600} size="sm">
          {matterData.clientData.fullname || ""}
        </Text>
      ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {isEditingClient
            ? selectedClientForEdit?.email_addresses[0].email_address || ""
            : matterData.clientData?.email || ""}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: isEditingClient
        ? selectedClientForEdit?.unsafe_metadata?.phoneNumber || "-"
        : clientData?.unsafe_metadata?.phoneNumber || "-",
    },
    {
      th: "Subscription",
      td: (
        <SubscriptionBadge
          isSubscribed={
            isEditingClient
              ? selectedClientForEdit?.unsafe_metadata?.subscription
                  ?.isSubscribed || false
              : clientData?.unsafe_metadata?.subscription?.isSubscribed || false
          }
          compact
        />
      ),
    },
  ];

  const selectedAttorneyForEdit = isEditingAttorney
    ? attorneyUsers.find((u) => u.id === editedAttorneyId)
    : null;

  const attorneyDetailsCardData = [
    {
      th: "Name",
      td: isEditingAttorney ? (
        <Select
          size="xs"
          value={editedAttorneyId}
          onChange={(value) => setEditedAttorneyId(value || "")}
          data={attorneyUsers
            .filter((user) => !user.banned)
            .map((user) => ({
              value: user.id,
              label: `${user.first_name} ${user.last_name}`,
            }))}
          searchable
          clearable
          nothingFoundMessage="No attorneys found"
        />
      ) : (
        <Text c="green" fw={600} size="sm">
          {attorneyData.first_name + " " + attorneyData.last_name}
        </Text>
      ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {isEditingAttorney
            ? selectedAttorneyForEdit?.email_addresses[0].email_address || ""
            : attorneyData.email_addresses[0].email_address}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: isEditingAttorney
        ? selectedAttorneyForEdit?.unsafe_metadata?.phoneNumber || "-"
        : attorneyData?.unsafe_metadata?.phoneNumber || "-",
    },
  ];

  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditDescription, setIsEditDescription] = useState(false);
  const [description, setDescription] = useState("");

  // Fetch clients and attorneys when editing
  useEffect(() => {
    if (isEditingClient && clientUsers.length === 0) {
      const fetchClients = async () => {
        try {
          const { data } = await axios.get("/api/clerk/organization/fetch", {
            params: {
              organization_id: CLERK_ORG_IDS.client,
              limit: 9999,
            },
          });
          setClientUsers(data);
        } catch (error) {
          console.error("Failed to fetch clients:", error);
        }
      };
      fetchClients();
    }
  }, [isEditingClient, clientUsers.length]);

  useEffect(() => {
    if (isEditingAttorney && attorneyUsers.length === 0) {
      const fetchAttorneys = async () => {
        try {
          const { data } = await axios.get("/api/clerk/organization/fetch", {
            params: {
              organization_id: CLERK_ORG_IDS.attorney,
              limit: 9999,
            },
          });
          setAttorneyUsers(data);
        } catch (error) {
          console.error("Failed to fetch attorneys:", error);
        }
      };
      fetchAttorneys();
    }
  }, [isEditingAttorney, attorneyUsers.length]);

  const handleUpdateMatter = async () => {
    setIsUpdatingMatter(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterData.id),
        {
          caseType: editedMatter.caseType,
          updatedAt: now,
        },
        { merge: true },
      );

      // Sync to Appwrite
      await syncToAppwrite("MATTERS", matterData.id, {
        matterNumber: matterData.caseNumber,
        leadAttorneyFirstName: attorneyData.first_name,
        leadAttorneyLastName: attorneyData.last_name,
        clientFirstName: matterData.clientData.fullname.split(" ")[0],
        clientLastName: matterData.clientData.fullname
          .split(" ")
          .slice(1)
          .join(" "),
        status: matterData.status,
        matterType: editedMatter.caseType.join("&_&"),
        leadAttorneyId: matterData.leadAttorney.id,
        clientId: matterData.clientData.id,
        search_blob: `${matterData.caseNumber} ${attorneyData.first_name} ${attorneyData.last_name} ${matterData.clientData.fullname} ${editedMatter.caseType.join(" ")}`,
      });

      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.SYSTEM,
        "Matter Type Updated",
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Matter details updated successfully",
        message: "The matter details have been updated successfully",
      });
      setIsEditingMatter(false);
    } catch (error) {
      console.error("Failed to update matter:", error);
      appNotifications.error({
        title: "Failed to update matter details",
        message: "The matter details could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingMatter(false);
    }
  };

  const handleUpdateClient = async () => {
    setIsUpdatingClient(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const selectedClient = clientUsers.find((u) => u.id === editedClientId);

      if (!selectedClient) {
        throw new Error("Client not found");
      }

      const newClientData = {
        id: selectedClient.id,
        fullname: `${selectedClient.first_name} ${selectedClient.last_name}`,
        imageUrl: selectedClient.profile_image_url,
        email: selectedClient.email_addresses[0].email_address,
      };

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterData.id),
        {
          clientData: newClientData,
          updatedAt: now,
        },
        { merge: true },
      );

      // Sync to Appwrite
      await syncToAppwrite("MATTERS", matterData.id, {
        matterNumber: matterData.caseNumber,
        leadAttorneyFirstName: attorneyData.first_name,
        leadAttorneyLastName: attorneyData.last_name,
        clientFirstName: selectedClient.first_name,
        clientLastName: selectedClient.last_name,
        status: matterData.status,
        matterType: matterData.caseType.join("&_&"),
        leadAttorneyId: matterData.leadAttorney.id,
        clientId: selectedClient.id,
        search_blob: `${matterData.caseNumber} ${attorneyData.first_name} ${attorneyData.last_name} ${selectedClient.first_name} ${selectedClient.last_name} ${matterData.caseType.join(" ")}`,
      });

      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.SYSTEM,
        "Client Updated",
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Client updated successfully",
        message: "The client has been updated successfully",
      });
      setIsEditingClient(false);
    } catch (error) {
      console.error("Failed to update client:", error);
      appNotifications.error({
        title: "Failed to update client",
        message: "The client could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingClient(false);
    }
  };

  const handleUpdateAttorney = async () => {
    setIsUpdatingAttorney(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const selectedAttorney = attorneyUsers.find(
        (u) => u.id === editedAttorneyId,
      );

      if (!selectedAttorney) {
        throw new Error("Attorney not found");
      }

      const newAttorneyData = {
        id: selectedAttorney.id,
        fullname: `${selectedAttorney.first_name} ${selectedAttorney.last_name}`,
        imageUrl: selectedAttorney.profile_image_url,
        email: selectedAttorney.email_addresses[0].email_address,
      };

      // Update old attorney's case count
      const oldAttorneyCasesCount =
        attorneyData?.unsafe_metadata?.involvedCases || 0;
      await axios.patch("/api/clerk/user/update-user-metadata", {
        userId: attorneyData.id,
        unsafe_metadata: {
          ...attorneyData?.unsafe_metadata,
          involvedCases: Math.max(0, oldAttorneyCasesCount - 1),
        },
      });

      // Update new attorney's case count
      const newAttorneyCasesCount =
        selectedAttorney?.unsafe_metadata?.involvedCases || 0;
      await axios.patch("/api/clerk/user/update-user-metadata", {
        userId: selectedAttorney.id,
        unsafe_metadata: {
          ...selectedAttorney?.unsafe_metadata,
          involvedCases: newAttorneyCasesCount + 1,
        },
      });

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterData.id),
        {
          leadAttorney: newAttorneyData,
          updatedAt: now,
        },
        { merge: true },
      );

      // Sync to Appwrite
      await syncToAppwrite("MATTERS", matterData.id, {
        matterNumber: matterData.caseNumber,
        leadAttorneyFirstName: selectedAttorney.first_name,
        leadAttorneyLastName: selectedAttorney.last_name,
        clientFirstName: matterData.clientData.fullname.split(" ")[0],
        clientLastName: matterData.clientData.fullname
          .split(" ")
          .slice(1)
          .join(" "),
        status: matterData.status,
        matterType: matterData.caseType.join("&_&"),
        leadAttorneyId: selectedAttorney.id,
        clientId: matterData.clientData.id,
        search_blob: `${matterData.caseNumber} ${selectedAttorney.first_name} ${selectedAttorney.last_name} ${matterData.clientData.fullname} ${matterData.caseType.join(" ")}`,
      });

      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.SYSTEM,
        "Lead Attorney Updated",
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Lead attorney updated successfully",
        message: "The lead attorney has been updated successfully",
      });
      setIsEditingAttorney(false);
    } catch (error) {
      console.error("Failed to update attorney:", error);
      appNotifications.error({
        title: "Failed to update lead attorney",
        message: "The lead attorney could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingAttorney(false);
    }
  };

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
        },
      );
      await addMatterUpdate(
        user!,
        matterData.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.DESCRIPTION,
        "Description Updated",
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
    setEditedMatter({
      caseType: matterData.caseType,
    });
    setEditedClientId(matterData.clientData.id);
    setEditedAttorneyId(matterData.leadAttorney.id);
  }, [matterData]);

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={shrink ? 1 : 3}>
        <VerticalTable
          title="Matter Details"
          data={caseDetailsCardData}
          editButton={
            isAdmin && !isEditingMatter ? (
              <ActionIcon
                variant="white"
                size="sm"
                color={theme.other.customPumpkin}
                onClick={() => setIsEditingMatter(true)}
              >
                <IconPencil size={20} />
              </ActionIcon>
            ) : isAdmin && isEditingMatter ? (
              <Group gap={4}>
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => {
                    setIsEditingMatter(false);
                    setEditedMatter({ caseType: matterData.caseType });
                  }}
                  disabled={isUpdatingMatter}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  loading={isUpdatingMatter}
                  onClick={handleUpdateMatter}
                  disabled={
                    !editedMatter.caseType.length ||
                    JSON.stringify(editedMatter.caseType) ===
                      JSON.stringify(matterData.caseType)
                  }
                >
                  Save
                </Button>
              </Group>
            ) : undefined
          }
        />
        <VerticalTable
          title="Client Details"
          data={clientDetailsCardData}
          editButton={
            isAdmin && !isEditingClient ? (
              <ActionIcon
                variant="white"
                size="sm"
                color={theme.other.customPumpkin}
                onClick={() => setIsEditingClient(true)}
              >
                <IconPencil size={20} />
              </ActionIcon>
            ) : isAdmin && isEditingClient ? (
              <Group gap={4}>
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => {
                    setIsEditingClient(false);
                    setEditedClientId(matterData.clientData.id);
                  }}
                  disabled={isUpdatingClient}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  loading={isUpdatingClient}
                  onClick={handleUpdateClient}
                  disabled={
                    !editedClientId ||
                    editedClientId === matterData.clientData.id
                  }
                >
                  Save
                </Button>
              </Group>
            ) : undefined
          }
        />
        <VerticalTable
          title="Lead Attorney"
          data={attorneyDetailsCardData}
          editButton={
            isAdmin && !isEditingAttorney ? (
              <ActionIcon
                variant="white"
                size="sm"
                color={theme.other.customPumpkin}
                onClick={() => setIsEditingAttorney(true)}
              >
                <IconPencil size={20} />
              </ActionIcon>
            ) : isAdmin && isEditingAttorney ? (
              <Group gap={4}>
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => {
                    setIsEditingAttorney(false);
                    setEditedAttorneyId(matterData.leadAttorney.id);
                  }}
                  disabled={isUpdatingAttorney}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  loading={isUpdatingAttorney}
                  onClick={handleUpdateAttorney}
                  disabled={
                    !editedAttorneyId ||
                    editedAttorneyId === matterData.leadAttorney.id
                  }
                >
                  Save
                </Button>
              </Group>
            ) : undefined
          }
        />
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

      <Flex direction={shrinkSmall ? "column-reverse" : "column"} gap="md">
        <MatterUpdates updates={matterUpdates.items} />
        <MatterNotes
          notes={matterData.notes || null}
          matterId={matterData.id}
          setDataChanged={setDataChanged}
        />
      </Flex>
    </Flex>
  );
}

const VerticalTable = ({
  title,
  data = [],
  editButton,
}: VerticalTableProps) => (
  <Card withBorder radius="md" p="md">
    <Card.Section inheritPadding py="xs">
      <Group justify="space-between" align="center">
        <Text size="lg" fw={600} c="green">
          {title}
        </Text>
        {editButton}
      </Group>
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
