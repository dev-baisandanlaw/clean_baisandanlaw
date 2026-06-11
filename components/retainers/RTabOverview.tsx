"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Button,
  Flex,
  Group,
  NumberInput,
  Radio,
  SimpleGrid,
  Spoiler,
  Stack,
  Table,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconBuilding, IconPencil, IconUser } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "../Common/BadgeComp";
import BasicCard from "../Common/BasicCard";
import NoteSection from "../Common/notes/NoteSection";
import { useUpdateRetainerMutation } from "@/store/services/retainerService";
import { Retainer } from "@/types/retainer-new";

interface RTabOverviewProps {
  retainerData: Retainer;
}

interface VerticalTableProps {
  title: string;
  data: { th: string; td: React.ReactNode }[];
  editButton?: React.ReactNode;
}

interface EditFormValues {
  clientName: string;
  clientType: string;
  areas: string[];
  retainerSince: Date;
  contactFullname: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  description: string;
}

export default function RTabOverview({ retainerData }: RTabOverviewProps) {
  const shrink = useMediaQuery("(max-width: 948px)");
  const theme = useMantineTheme();
  const { user } = useUser();

  const isAdmin = user?.unsafeMetadata?.role === "admin";

  const [updateRetainerFn, { isLoading: isUpdatingRetainer }] =
    useUpdateRetainerMutation();

  const [editModule, setEditModule] = useState("");

  const form = useForm<EditFormValues>({
    initialValues: {
      clientName: retainerData.clientName,
      clientType: retainerData.clientType,
      areas: retainerData.areas,
      retainerSince: new Date(retainerData.retainerSince),
      contactFullname: retainerData.contactPerson.fullname,
      contactEmail: retainerData.contactPerson.email || "",
      contactPhone: retainerData.contactPerson.phone || "",
      contactAddress: retainerData.contactPerson.fullAddress || "",
      description: retainerData.description || "",
    },
  });

  const isContactValid =
    form.values.contactFullname.trim().length > 0 &&
    form.values.contactEmail.trim().length > 0 &&
    /^\S+@\S+$/.test(form.values.contactEmail) &&
    String(form.values.contactPhone).length >= 10 &&
    form.values.contactAddress.trim().length > 0;

  const isDetailsUnchanged =
    form.values.clientName === retainerData.clientName &&
    form.values.clientType === retainerData.clientType &&
    JSON.stringify(form.values.areas) === JSON.stringify(retainerData.areas) &&
    getDateFormatDisplay(form.values.retainerSince) ===
      getDateFormatDisplay(retainerData.retainerSince);

  const isContactUnchanged =
    form.values.contactFullname === retainerData.contactPerson.fullname &&
    form.values.contactEmail === (retainerData.contactPerson.email || "") &&
    form.values.contactPhone === (retainerData.contactPerson.phone || "") &&
    form.values.contactAddress ===
      (retainerData.contactPerson.fullAddress || "");

  const handleUpdateRetainer = () => {
    const preparePayload = (): Partial<{
      clientName: string;
      clientType: string;
      areas: string[];
      retainerSince: string;
      contactPerson: Retainer["contactPerson"];
      description: string;
    }> => {
      switch (editModule) {
        case "details":
          return {
            clientName: form.values.clientName,
            clientType: form.values.clientType,
            areas: form.values.areas,
            retainerSince: getDateFormatDisplay(form.values.retainerSince),
          };

        case "contact":
          return {
            contactPerson: {
              id: retainerData.contactPerson.id,
              fullname: form.values.contactFullname,
              email: form.values.contactEmail,
              phone: form.values.contactPhone,
              fullAddress: form.values.contactAddress,
            },
          };

        case "description":
          return { description: form.values.description };

        default:
          return {};
      }
    };

    const payload = preparePayload();
    if (Object.keys(payload).length === 0) return;

    updateRetainerFn({ id: retainerData.id, ...payload })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Updated successfully",
          message: "The retainer has been updated successfully.",
        });
        setEditModule("");
      })
      .catch((e) => {
        const message =
          e?.data?.message ??
          "The update could not be completed. Please try again.";

        appNotifications.error({
          title: "Update Retainer failed",
          message,
        });
      });
  };

  const handleCancel = (module: string) => {
    switch (module) {
      case "details":
        form.setFieldValue("clientName", retainerData.clientName);
        form.setFieldValue("clientType", retainerData.clientType);
        form.setFieldValue("areas", retainerData.areas);
        form.setFieldValue(
          "retainerSince",
          new Date(retainerData.retainerSince),
        );
        break;
      case "contact":
        form.setFieldValue(
          "contactFullname",
          retainerData.contactPerson.fullname,
        );
        form.setFieldValue(
          "contactEmail",
          retainerData.contactPerson.email || "",
        );
        form.setFieldValue(
          "contactPhone",
          retainerData.contactPerson.phone || "",
        );
        form.setFieldValue(
          "contactAddress",
          retainerData.contactPerson.fullAddress || "",
        );
        break;
      case "description":
        form.setFieldValue("description", retainerData.description || "");
        break;
    }
    setEditModule("");
  };

  const retainerDetailsCardData = [
    {
      th: "Client Name",
      td:
        editModule === "details" ? (
          <TextInput
            size="xs"
            placeholder="Enter client name"
            {...form.getInputProps("clientName")}
          />
        ) : (
          <Group gap="xs">
            {retainerData.clientType === "individual" ? (
              <IconUser size={18} />
            ) : (
              <IconBuilding size={18} />
            )}
            <Text c="green" fw={600} size="sm">
              {retainerData.clientName}
            </Text>
          </Group>
        ),
    },
    {
      th: "Client Type",
      td:
        editModule === "details" ? (
          <Radio.Group {...form.getInputProps("clientType")}>
            <Group gap="xs">
              <Radio value="individual" label="Individual" size="xs" />
              <Radio value="company" label="Company" size="xs" />
            </Group>
          </Radio.Group>
        ) : (
          <Text c="green" fw={600} size="sm" tt="capitalize">
            {retainerData.clientType}
          </Text>
        ),
    },
    {
      th: "Areas",
      td:
        editModule === "details" ? (
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
            {...form.getInputProps("areas")}
          />
        ) : (
          <Tooltip
            label={retainerData.areas.join(", ")}
            withArrow
            multiline
            maw={200}
          >
            <Group gap={2}>
              {retainerData.areas.slice(0, 3).map((area) => (
                <AreaBadge key={area} area={area} />
              ))}
              {retainerData.areas.length > 3 && (
                <AreaBadge
                  key="more"
                  area={`+${retainerData.areas.length - 3}`}
                />
              )}
            </Group>
          </Tooltip>
        ),
    },
    {
      th: "Retainer Since",
      td:
        editModule === "details" ? (
          <DatePickerInput
            size="xs"
            clearable
            hideOutsideDates
            {...form.getInputProps("retainerSince")}
          />
        ) : (
          getDateFormatDisplay(retainerData.retainerSince)
        ),
    },
  ];

  const contactDetailsCardData = [
    {
      th: "Name",
      td:
        editModule === "contact" ? (
          <TextInput size="xs" {...form.getInputProps("contactFullname")} />
        ) : (
          <Text c="green" fw={600} size="sm">
            {retainerData.contactPerson.fullname}
          </Text>
        ),
    },
    {
      th: "Email",
      td:
        editModule === "contact" ? (
          <TextInput size="xs" {...form.getInputProps("contactEmail")} />
        ) : (
          <Text c="green" fw={600} size="sm">
            {retainerData.contactPerson.email || "-"}
          </Text>
        ),
    },
    {
      th: "Phone",
      td:
        editModule === "contact" ? (
          <NumberInput
            size="xs"
            hideControls
            maxLength={10}
            placeholder="912 345 6789"
            leftSection={
              <Text size="sm" c="dimmed">
                +63
              </Text>
            }
            allowNegative={false}
            {...form.getInputProps("contactPhone")}
          />
        ) : (
          retainerData.contactPerson.phone || "-"
        ),
    },
    {
      th: "Address",
      td:
        editModule === "contact" ? (
          <TextInput size="xs" {...form.getInputProps("contactAddress")} />
        ) : (
          retainerData.contactPerson.fullAddress || "-"
        ),
    },
  ];

  useEffect(() => {
    form.setValues({
      clientName: retainerData.clientName,
      clientType: retainerData.clientType,
      areas: retainerData.areas,
      retainerSince: new Date(retainerData.retainerSince),
      contactFullname: retainerData.contactPerson.fullname,
      contactEmail: retainerData.contactPerson.email || "",
      contactPhone: retainerData.contactPerson.phone || "",
      contactAddress: retainerData.contactPerson.fullAddress || "",
      description: retainerData.description || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retainerData]);

  const renderEditButton = (module: string, isSaveDisabled: boolean) => {
    if (!isAdmin) return undefined;

    if (editModule !== module) {
      return (
        <ActionIcon
          variant="subtle"
          size="sm"
          color={theme.other.customPumpkin}
          onClick={() => setEditModule(module)}
          disabled={!!editModule}
        >
          <IconPencil size={18} />
        </ActionIcon>
      );
    }

    return (
      <Group gap={4}>
        <Button
          size="xs"
          variant="default"
          onClick={() => handleCancel(module)}
          disabled={isUpdatingRetainer}
        >
          Cancel
        </Button>
        <Button
          size="xs"
          loading={isUpdatingRetainer}
          onClick={handleUpdateRetainer}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </Group>
    );
  };

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={shrink ? 1 : 2}>
        <VerticalTable
          title="Retainer Details"
          data={retainerDetailsCardData}
          editButton={renderEditButton(
            "details",
            !form.values.clientName.trim().length ||
              !form.values.areas.length ||
              isDetailsUnchanged,
          )}
        />
        <VerticalTable
          title="Contact Details"
          data={contactDetailsCardData}
          editButton={renderEditButton(
            "contact",
            !isContactValid || isContactUnchanged,
          )}
        />
      </SimpleGrid>

      <Stack w="100%">
        <BasicCard
          title="Description"
          actionButton={renderEditButton(
            "description",
            !form.values.description.trim().length ||
              form.values.description === (retainerData.description || ""),
          )}
          containerProps={{ w: "100%" }}
        >
          {editModule === "description" ? (
            <Textarea
              minRows={6}
              autosize
              styles={{ input: { paddingBlock: 6 } }}
              {...form.getInputProps("description")}
              inputWrapperOrder={["label", "error", "input", "description"]}
              description={`${form.values.description.length}/1000 characters`}
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
                {retainerData.description || "-"}
              </Text>
            </Spoiler>
          )}
        </BasicCard>

        <NoteSection
          from="retainer"
          notes={retainerData.notes || []}
          slugId={retainerData.id}
        />
      </Stack>
    </Flex>
  );
}

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
