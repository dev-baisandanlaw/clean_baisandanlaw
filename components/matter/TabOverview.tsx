"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Button,
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
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconPencil } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import { ATTY_PRACTICE_AREAS, CLERK_ORG_IDS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "../Common/BadgeComp";
import SubscriptionBadge from "../Common/SubscriptionBadge";

import { Matter } from "@/types/matter";
import { UserReference } from "@/types/user-reference";
import { Attorney, Client } from "@/types/user";
import { useUpdateMatterMutation } from "@/store/services/matterService";
import BasicCard from "../Common/BasicCard";

// --- Types ---

interface MatterTabOverviewProps {
  matterData: Matter;
}

interface VerticalTableProps {
  title: string;
  data: { th: string; td: React.ReactNode }[];
  editButton?: React.ReactNode;
}

interface EditFormValues {
  caseNumber: string;
  caseType: string[];
  clientId: string;
  attorneyId: string;
  description: string;
}

// --- Component ---

export default function TabOverview({ matterData }: MatterTabOverviewProps) {
  const shrink = useMediaQuery("(max-width: 948px)");
  const theme = useMantineTheme();
  const { user } = useUser();

  const [updateMatterFn, { isLoading: isUpdatingMatter }] =
    useUpdateMatterMutation();

  const isAdmin = user?.unsafeMetadata?.role === "admin";

  // Which section is being edited
  const [editModule, setEditModule] = useState("");

  // Consolidated form state via useForm
  const form = useForm<EditFormValues>({
    initialValues: {
      caseNumber: matterData.caseNumber,
      caseType: matterData.caseType,
      clientId: matterData.clientData.id || "",
      attorneyId: matterData.leadAttorney.id || "",
      description: matterData.caseDescription || "",
    },
  });

  // Clerk user lists (fetched on-demand when editing)
  const [clientUsers, setClientUsers] = useState<Client[]>([]);
  const [attorneyUsers, setAttorneyUsers] = useState<Attorney[]>([]);

  // Derived selected users for editing
  const selectedClientForEdit =
    editModule === "client"
      ? clientUsers.find((u) => u.id === form.values.clientId)
      : null;

  const selectedAttorneyForEdit =
    editModule === "attorney"
      ? attorneyUsers.find((u) => u.id === form.values.attorneyId)
      : null;

  // --- Update handler ---

  const handleUpdateMatter = () => {
    const preparePayload = (): Partial<{
      caseNumber: string;
      caseType: string[];
      caseDescription: string;
      clientData: UserReference;
      leadAttorney: UserReference;
    }> => {
      switch (editModule) {
        case "matter":
          return {
            caseNumber: form.values.caseNumber,
            caseType: form.values.caseType,
          };

        case "description":
          return { caseDescription: form.values.description };

        case "client": {
          if (!selectedClientForEdit) return {};
          const clientPayload: UserReference = {
            id: selectedClientForEdit.id,
            fullname: `${selectedClientForEdit.first_name} ${selectedClientForEdit.last_name}`,
            email: selectedClientForEdit.email_addresses[0].email_address,
          };
          if (selectedClientForEdit.unsafe_metadata?.phoneNumber) {
            clientPayload.phone =
              selectedClientForEdit.unsafe_metadata.phoneNumber;
          }
          return { clientData: clientPayload };
        }

        case "attorney": {
          if (!selectedAttorneyForEdit) return {};
          return {
            leadAttorney: {
              id: selectedAttorneyForEdit.id,
              fullname: `${selectedAttorneyForEdit.first_name} ${selectedAttorneyForEdit.last_name}`,
              email: selectedAttorneyForEdit.email_addresses[0].email_address,
            },
          };
        }

        default:
          return {};
      }
    };

    const payload = preparePayload();
    if (Object.keys(payload).length === 0) return;

    updateMatterFn({ id: matterData.id, ...payload })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Updated successfully",
          message: "The matter has been updated successfully.",
        });
        setEditModule("");
      })
      .catch(() => {
        appNotifications.error({
          title: "Update failed",
          message: "The update could not be completed. Please try again.",
        });
      });
  };

  // --- Cancel: reset form fields to original values ---

  const handleCancel = (module: string) => {
    switch (module) {
      case "matter":
        form.setFieldValue("caseNumber", matterData.caseNumber);
        form.setFieldValue("caseType", matterData.caseType);
        break;
      case "client":
        form.setFieldValue("clientId", matterData.clientData.id || "");
        break;
      case "attorney":
        form.setFieldValue("attorneyId", matterData.leadAttorney.id || "");
        break;
      case "description":
        form.setFieldValue("description", matterData.caseDescription || "");
        break;
    }
    setEditModule("");
  };

  // --- Card data ---

  const caseDetailsCardData = [
    {
      th: "Matter No.",
      td:
        editModule === "matter" ? (
          <TextInput
            placeholder="Enter Matter Number"
            {...form.getInputProps("caseNumber")}
          />
        ) : (
          <Text c="green" fw={600} size="sm">
            {matterData.caseNumber}
          </Text>
        ),
    },
    {
      th: "Matter Type",
      td:
        editModule === "matter" ? (
          <TagsInput
            size="xs"
            data={ATTY_PRACTICE_AREAS}
            clearable
            styles={{
              pill: {
                backgroundColor: theme.colors.green[0],
                color: theme.colors.green[9],
              },
            }}
            {...form.getInputProps("caseType")}
          />
        ) : (
          <Tooltip
            label={matterData.caseType.join(", ")}
            withArrow
            multiline
            maw={200}
          >
            <Group gap={2}>
              {matterData.caseType.slice(0, 3).map((type) => (
                <AreaBadge key={type} area={type} />
              ))}
              {matterData.caseType.length > 3 && (
                <AreaBadge
                  key="more"
                  area={`+${matterData.caseType.length - 3}`}
                />
              )}
            </Group>
          </Tooltip>
        ),
    },
    {
      th: "Date Created",
      td: getDateFormatDisplay(matterData.createdAt, true),
    },
    {
      th: "Last Update",
      td: getDateFormatDisplay(matterData.updatedAt, true),
    },
  ];

  const clientDetailsCardData = [
    {
      th: "Name",
      td:
        editModule === "client" ? (
          <Select
            size="xs"
            data={clientUsers.map((u) => ({
              value: u.id,
              label: `${u.first_name} ${u.last_name}`,
            }))}
            searchable
            clearable
            nothingFoundMessage="No clients found"
            {...form.getInputProps("clientId")}
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
          {editModule === "client"
            ? selectedClientForEdit?.email_addresses[0].email_address || ""
            : matterData.clientData?.email || ""}
        </Text>
      ),
    },
    {
      th: "Phone",
      td:
        editModule === "client"
          ? selectedClientForEdit?.unsafe_metadata?.phoneNumber || "-"
          : "-",
    },
    {
      th: "Subscription",
      td: (
        <SubscriptionBadge
          isSubscribed={
            editModule === "client"
              ? selectedClientForEdit?.unsafe_metadata?.subscription
                  ?.isSubscribed || false
              : false
          }
          compact
        />
      ),
    },
  ];

  const attorneyDetailsCardData = [
    {
      th: "Name",
      td:
        editModule === "attorney" ? (
          <Select
            size="xs"
            data={attorneyUsers
              .filter((u) => !u.banned)
              .map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}`,
              }))}
            searchable
            clearable
            nothingFoundMessage="No attorneys found"
            {...form.getInputProps("attorneyId")}
          />
        ) : (
          <Text c="green" fw={600} size="sm">
            {matterData.leadAttorney.fullname}
          </Text>
        ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {editModule === "attorney"
            ? selectedAttorneyForEdit?.email_addresses[0].email_address || ""
            : matterData.leadAttorney.email || ""}
        </Text>
      ),
    },
    {
      th: "Phone",
      td:
        editModule === "attorney"
          ? selectedAttorneyForEdit?.unsafe_metadata?.phoneNumber || "-"
          : "-",
    },
  ];

  // --- Effects ---

  useEffect(() => {
    if (editModule === "client" && clientUsers.length === 0) {
      axios
        .get("/api/clerk/organization/fetch", {
          params: { organization_id: CLERK_ORG_IDS.client, limit: 500 },
        })
        .then(({ data }) => setClientUsers(data))
        .catch((err) => console.error("Failed to fetch clients:", err));
    }
  }, [editModule, clientUsers.length]);

  useEffect(() => {
    if (editModule === "attorney" && attorneyUsers.length === 0) {
      axios
        .get("/api/clerk/organization/fetch", {
          params: { organization_id: CLERK_ORG_IDS.attorney, limit: 500 },
        })
        .then(({ data }) => setAttorneyUsers(data))
        .catch((err) => console.error("Failed to fetch attorneys:", err));
    }
  }, [editModule, attorneyUsers.length]);

  // Sync form when matterData changes (e.g. after refetch)
  useEffect(() => {
    form.setValues({
      caseNumber: matterData.caseNumber,
      caseType: matterData.caseType,
      clientId: matterData.clientData.id || "",
      attorneyId: matterData.leadAttorney.id || "",
      description: matterData.caseDescription || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData]);

  // --- Edit button helper ---

  const renderEditButton = (module: string, isSaveDisabled: boolean) => {
    if (!isAdmin) return undefined;

    if (editModule !== module) {
      return (
        <ActionIcon
          variant="white"
          size="sm"
          color={theme.other.customPumpkin}
          onClick={() => setEditModule(module)}
          disabled={!!editModule}
        >
          <IconPencil size={20} />
        </ActionIcon>
      );
    }

    return (
      <Group gap={4}>
        <Button
          size="xs"
          variant="default"
          onClick={() => handleCancel(module)}
          disabled={isUpdatingMatter}
        >
          Cancel
        </Button>
        <Button
          size="xs"
          loading={isUpdatingMatter}
          onClick={handleUpdateMatter}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </Group>
    );
  };

  // --- Render ---

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={shrink ? 1 : 3}>
        <VerticalTable
          title="Matter Details"
          data={caseDetailsCardData}
          editButton={renderEditButton(
            "matter",
            !form.values.caseNumber.trim().length ||
              !form.values.caseType.length,
          )}
        />
        <VerticalTable
          title="Client Details"
          data={clientDetailsCardData}
          editButton={renderEditButton(
            "client",
            !form.values.clientId ||
              form.values.clientId === matterData.clientData.id,
          )}
        />
        <VerticalTable
          title="Lead Attorney"
          data={attorneyDetailsCardData}
          editButton={renderEditButton(
            "attorney",
            !form.values.attorneyId ||
              form.values.attorneyId === matterData.leadAttorney.id,
          )}
        />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group align="center" mb="sm" gap={4} justify="space-between">
          <Text size="lg" fw={600} c="green">
            Description
          </Text>

          {editModule !== "description" &&
            user?.unsafeMetadata.role !== "client" && (
              <ActionIcon
                variant="white"
                size="sm"
                color={theme.other.customPumpkin}
                onClick={() => setEditModule("description")}
                disabled={!!editModule}
              >
                <IconPencil size={20} />
              </ActionIcon>
            )}

          {editModule === "description" && (
            <Group gap={4}>
              <Button
                size="xs"
                variant="default"
                onClick={() => handleCancel("description")}
                disabled={isUpdatingMatter}
              >
                Discard
              </Button>
              <Button
                size="xs"
                loading={isUpdatingMatter}
                onClick={handleUpdateMatter}
                disabled={
                  !form.values.description.trim().length ||
                  matterData.caseDescription === form.values.description
                }
              >
                Save
              </Button>
            </Group>
          )}
        </Group>

        {editModule === "description" ? (
          <Textarea
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("description")}
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
    </Flex>
  );
}

// --- Sub-components ---

const VerticalTable = ({
  title,
  data = [],
  editButton,
}: VerticalTableProps) => (
  <BasicCard title={title} actionButton={editButton} bodyProps={{ p: 0 }}>
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
  </BasicCard>
);
