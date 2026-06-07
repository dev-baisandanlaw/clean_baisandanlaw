"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Loader,
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

import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "../Common/BadgeComp";

import { Matter } from "@/types/matter";
import { UserReference } from "@/types/user-reference";
import { useUpdateMatterMutation } from "@/store/services/matterService";
import BasicCard from "../Common/BasicCard";
import { useGetUsersByOrgQuery } from "@/store/services/userService";

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
  const { user, isLoaded, isSignedIn } = useUser();

  const isAdmin = user?.unsafeMetadata?.role === "admin";

  const [updateMatterFn, { isLoading: isUpdatingMatter }] =
    useUpdateMatterMutation();

  const { data: users, isLoading: isLoadingUsers } = useGetUsersByOrgQuery(
    {
      types: ["attorney", "client"],
    },
    { skip: !isLoaded || !isSignedIn || !isAdmin },
  );

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

  // Derived selected users for editing
  const selectedClientForEdit =
    editModule === "client"
      ? users?.client.find((u) => u.id === form.values.clientId)
      : null;

  const selectedAttorneyForEdit =
    editModule === "attorney"
      ? users?.attorney.find((u) => u.id === form.values.attorneyId)
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
            fullname: selectedClientForEdit.fullname,
            email: selectedClientForEdit.email,
            phone: selectedClientForEdit?.phone || undefined,
          };
          return { clientData: clientPayload };
        }

        case "attorney": {
          if (!selectedAttorneyForEdit) return {};
          return {
            leadAttorney: {
              id: selectedAttorneyForEdit.id,
              fullname: selectedAttorneyForEdit.fullname,
              email: selectedAttorneyForEdit.email,
              phone: selectedAttorneyForEdit.phone,
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
      .catch((e) => {
        const message =
          e?.data?.message ??
          "The update could not be completed. Please try again.";

        appNotifications.error({
          title: "Update Matter failed",
          message,
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
  ];

  const clientDetailsCardData = [
    {
      th: "Name",
      td:
        editModule === "client" ? (
          <Select
            size="xs"
            data={users?.client.map((u) => ({
              value: u?.id || "",
              label: u.fullname,
            }))}
            disabled={isLoadingUsers}
            rightSection={isLoadingUsers ? <Loader size="sm" /> : null}
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
            ? selectedClientForEdit?.email || "-"
            : matterData.clientData?.email || "-"}
        </Text>
      ),
    },
    {
      th: "Phone",
      td:
        editModule === "client"
          ? selectedClientForEdit?.phone || "-"
          : matterData?.clientData?.phone || "-",
    },
  ];

  const attorneyDetailsCardData = [
    {
      th: "Name",
      td:
        editModule === "attorney" ? (
          <Select
            size="xs"
            data={users?.attorney.map((u) => ({
              value: u?.id || "",
              label: u.fullname,
            }))}
            disabled={isLoadingUsers}
            rightSection={isLoadingUsers ? <Loader size="sm" /> : null}
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
            ? selectedAttorneyForEdit?.email || "-"
            : matterData.leadAttorney.email || "-"}
        </Text>
      ),
    },
    {
      th: "Phone",
      td:
        editModule === "attorney"
          ? selectedAttorneyForEdit?.phone || "-"
          : matterData?.leadAttorney?.phone || "-",
    },
  ];

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
