import { useEffect } from "react";

import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput, TimePicker, TimeValue } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";

import AppModal from "@/components/Common/modal/AppModal";
import {
  useCreateMatterScheduleMutation,
  useGetMatterLeadAttorneyAppointmentsByDateQuery,
  useUpdateMatterScheduleMutation,
} from "@/store/services/matterService";
import { Matter, MatterSchedule } from "@/types/matter";
import { UserReference } from "@/types/user-reference";
import { appNotifications } from "@/utils/notifications/notifications";

type ScheduleFormValues = {
  caseId: string;
  leadAttorney: UserReference;
  clientDetails: UserReference;
  dateValue: Date | null;
  date: string;
  time: string;
  title: string;
  location: string;
  description: string;
};

type TabScheduleUpsertScheduleModalProps = {
  opened: boolean;
  onClose: () => void;
  matterData: Matter;
  schedule?: MatterSchedule | null;
};

const getInitialValues = (
  matterData: Matter,
  schedule?: MatterSchedule | null,
): ScheduleFormValues => ({
  caseId: matterData.id,
  leadAttorney: matterData.leadAttorney,
  clientDetails: matterData.clientData,
  dateValue: schedule?.date ? dayjs(schedule.date).toDate() : new Date(),
  date: schedule?.date || dayjs().format("YYYY-MM-DD"),
  time: schedule?.time || "",
  title: schedule?.title || "",
  location: schedule?.location || "",
  description: schedule?.description || "",
});

export default function TabScheduleUpsertScheduleModal({
  opened,
  onClose,
  matterData,
  schedule,
}: TabScheduleUpsertScheduleModalProps) {
  const [createMatterScheduleFn, { isLoading: isCreating }] =
    useCreateMatterScheduleMutation();
  const [updateMatterScheduleFn, { isLoading: isUpdating }] =
    useUpdateMatterScheduleMutation();

  const form = useForm<ScheduleFormValues>({
    initialValues: getInitialValues(matterData, schedule),
    validate: {
      title: (value) => (!value.trim() ? "Title is required" : null),
      location: (value) => (!value.trim() ? "Location is required" : null),
      description: (value) =>
        !value.trim() ? "Description is required" : null,
      date: (value) =>
        !value
          ? "Date is required"
          : dayjs(value).isBefore(dayjs(), "day")
            ? "Date cannot be earlier than today"
            : null,
      time: (value) => (!value ? "Time is required" : null),
    },
    validateInputOnChange: true,
  });

  const { data: leadAttorneyAppointments = [], isFetching } =
    useGetMatterLeadAttorneyAppointmentsByDateQuery(
      { caseId: matterData.id, date: form.values.date },
      { skip: !opened || !form.values.date },
    );

  const isEditing = !!schedule;
  const isSubmitting = isCreating || isUpdating;
  const hasAppointmentConflict = leadAttorneyAppointments.length > 0;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = (values: ScheduleFormValues) => {
    const payload = {
      caseId: values.caseId,
      date: values.date,
      time: values.time,
      title: values.title.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
    };

    const mutation = schedule?.id
      ? updateMatterScheduleFn({ id: schedule.id, ...payload })
      : createMatterScheduleFn(payload);

    mutation
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: isEditing
            ? "Schedule updated successfully"
            : "Schedule created successfully",
          message: isEditing
            ? "The schedule has been updated successfully."
            : "The schedule has been created successfully.",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: isEditing
            ? "Failed to update schedule"
            : "Failed to add schedule",
          message: isEditing
            ? "The schedule could not be updated. Please try again."
            : "The schedule could not be added. Please try again.",
        });
      });
  };

  useEffect(() => {
    if (!opened) {
      form.reset();
      return;
    }

    form.setValues(getInitialValues(matterData, schedule));
    form.resetDirty(getInitialValues(matterData, schedule));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, matterData.id, schedule?.id]);

  return (
    <AppModal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? "Update Schedule" : "Add Schedule"}
      size="lg"
      closable={!isSubmitting}
      type="success"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Lead Attorney"
              value={matterData.leadAttorney.fullname}
              readOnly
            />
            <TextInput
              label="Client"
              value={matterData.clientData.fullname}
              readOnly
            />
          </SimpleGrid>

          <TextInput
            withAsterisk
            label="Title"
            placeholder="1st local hearing"
            {...form.getInputProps("title")}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <DatePickerInput
              withAsterisk
              label="Date"
              placeholder="Select date"
              clearable={false}
              hideOutsideDates
              minDate={new Date()}
              value={form.values.dateValue}
              onChange={(value) => {
                const dateValue = value ? new Date(value) : null;

                form.setFieldValue("dateValue", dateValue);
                form.setFieldValue(
                  "date",
                  dateValue ? dayjs(dateValue).format("YYYY-MM-DD") : "",
                );
              }}
              error={form.errors.date}
            />

            <TimePicker
              withAsterisk
              withDropdown
              label="Time"
              onKeyDown={(e) => e.preventDefault()}
              {...form.getInputProps("time")}
            />
          </SimpleGrid>

          {isFetching ? (
            <Paper withBorder radius="sm" p="sm">
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm" c="dimmed">
                  Checking lead attorney appointments
                </Text>
              </Group>
            </Paper>
          ) : (
            hasAppointmentConflict && (
              <Alert
                mt="md"
                p="md"
                color="blue"
                styles={(theme) => ({
                  title: { fontWeight: 600, color: theme.colors.blue[7] },
                  body: { gap: 2 },
                  root: { paddingBlock: 12 },
                })}
              >
                <Text size="xs" fw={600} mb="sm">
                  Attorney&apos;s Booked Times with this date
                </Text>
                <TableScrollContainer mah={400} minWidth={200}>
                  <Table withRowBorders style={{ borderRadius: 8 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th fz="xs">Time</Table.Th>
                        <Table.Th fz="xs">Client</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {leadAttorneyAppointments.map((appointment) => (
                        <Table.Tr key={appointment.id}>
                          <Table.Td fw={600} fz="xs">
                            <TimeValue value={appointment.time} format="12h" />
                          </Table.Td>
                          <Table.Td fw={600} fz="xs">
                            {appointment.clientDetails.fullname}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </TableScrollContainer>
              </Alert>
            )
          )}

          <TextInput
            withAsterisk
            label="Location"
            placeholder="Pampanga City Hall"
            {...form.getInputProps("location")}
          />

          <Textarea
            withAsterisk
            label="Description"
            placeholder="Type the schedule description"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            inputWrapperOrder={["label", "error", "input", "description"]}
            description={`${form.values.description.length}/1000 characters`}
            {...form.getInputProps("description")}
          />

          <Group justify="end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={
                !form.values.title.trim() ||
                !form.values.location.trim() ||
                !form.values.description.trim() ||
                !form.values.date ||
                !form.values.time
              }
            >
              {isEditing ? "Update Schedule" : "Add Schedule"}
            </Button>
          </Group>
        </Stack>
      </form>
    </AppModal>
  );
}
