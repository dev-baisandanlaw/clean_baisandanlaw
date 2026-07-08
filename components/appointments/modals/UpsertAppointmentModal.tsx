import { useEffect, useMemo } from "react";

import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  em,
  FocusTrap,
  Group,
  Loader,
  NumberInput,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput, getTimeRange, TimeValue } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { IconInfoCircle } from "@tabler/icons-react";
import dayjs from "dayjs";

import AppModal from "@/components/Common/modal/AppModal";
import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import {
  useGetBookingsByMonthQuery,
  useManualBookNewAppointmentMutation,
  useManualUpdateBookingMutation,
} from "@/store/services/bookingService";
import { useGetAttorneyMatterSchedulesByDateQuery } from "@/store/services/matterService";
import { useGetUsersByOrgQuery } from "@/store/services/userService";
import { Booking } from "@/types/booking";
import { BookingSettings } from "@/types/bookingSettings";
import { UserReference } from "@/types/user-reference";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  buildClientDetails,
  getInitialManualAppointmentValues,
  type ManualAppointmentFormValues,
} from "./helpers/upsertAppointmentHelpers";

type UpsertAppointmentModalProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  bookingSettings?: BookingSettings;
};

export default function UpsertAppointmentModal({
  opened,
  onClose,
  booking,
  bookingSettings,
}: UpsertAppointmentModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const theme = useMantineTheme();

  const [manualBookNewAppointmentFn, { isLoading: isSaving }] =
    useManualBookNewAppointmentMutation();
  const [manualUpdateBookingFn, { isLoading: isUpdating }] =
    useManualUpdateBookingMutation();

  const { data: usersByOrg, isFetching: isFetchingUsers } =
    useGetUsersByOrgQuery({ types: ["attorney", "client"] }, { skip: !opened });

  const form = useForm<ManualAppointmentFormValues>({
    initialValues: getInitialManualAppointmentValues(),
    validate: {
      clientDetails: {
        fullname: (value) => (!value.length ? "Full name is required" : null),
        email: (value) =>
          !value?.length
            ? "Email is required"
            : /^\S+@\S+$/.test(value)
              ? null
              : "Invalid Email",
        phone: (value) =>
          String(value || "").length < 10 ? "Invalid Phone Number" : null,
      },
    },
    validateInputOnChange: true,
  });

  const selectedMonth = form.values.dateValue
    ? dayjs(form.values.dateValue).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");

  const { data: monthBookings = [] } = useGetBookingsByMonthQuery(
    { month: selectedMonth },
    { skip: !opened },
  );

  const attorneyUsers = usersByOrg?.attorney ?? [];
  const clientUsers = usersByOrg?.client ?? [];
  const matchedClient = clientUsers.find(
    (client) =>
      client.email?.trim().toLowerCase() ===
      form.values.clientDetails.email?.trim().toLowerCase(),
  );
  const clientEmailOptions = clientUsers
    .map((client) => client.email)
    .filter((email): email is string => !!email);

  const normalizeClientDetails = (
    client: UserReference,
    fallbackEmail: string,
  ): ManualAppointmentFormValues["clientDetails"] => ({
    fullname: client.fullname || "",
    email: client.email || fallbackEmail,
    id: client.id || "",
    phone: client.phone ? String(client.phone) : "",
    fullAddress: client.fullAddress || client.fullAddres || "",
    birthday: client.birthday ? new Date(client.birthday) : null,
  });

  const fillClientFromEmail = (email: string) => {
    if (booking) {
      form.setFieldValue("clientDetails.email", email);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const client = clientUsers.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (!client) {
      form.setFieldValue("existingClient", false);
      form.setFieldValue("clientDetails", {
        fullname: "",
        email,
        id: "",
        phone: "",
        fullAddress: "",
        birthday: null,
      });
      return;
    }

    form.setFieldValue("existingClient", true);
    form.setFieldValue("clientDetails", normalizeClientDetails(client, email));
  };

  const selectedDate = form.values.date || "";

  const {
    data: attorneyMatterSchedules = [],
    isFetching: isFetchingMatterSchedules,
  } = useGetAttorneyMatterSchedulesByDateQuery(
    { attorneyId: form.values.attorneyId || "", date: selectedDate },
    { skip: !opened || !form.values.attorneyId || !selectedDate },
  );

  const attyBookings = useMemo(
    () =>
      monthBookings
        .filter(
          (item) =>
            item.attorneyId === form.values.attorneyId &&
            item.date === selectedDate &&
            item.id !== booking?.id,
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [booking?.id, form.values.attorneyId, monthBookings, selectedDate],
  );
  const shouldShowAttorneyDateNotice =
    !!form.values.dateValue &&
    !!form.values.attorneyId &&
    (isFetchingMatterSchedules ||
      attyBookings.length > 0 ||
      attorneyMatterSchedules.length > 0);

  const times = useMemo(() => {
    if (!bookingSettings) return [];

    return getTimeRange({
      startTime: bookingSettings.officeHourStart,
      endTime: bookingSettings.officeHourEnd,
      interval: `${bookingSettings.bookingIntervalMinutes}:00`,
    }).map((time) => {
      const hhmm = time.slice(0, 5);

      return {
        value: hhmm,
        label: dayjs(`2000-01-01 ${hhmm}`).format("h:mm A"),
      };
    });
  }, [bookingSettings]);

  const handleSubmit = (values: ManualAppointmentFormValues) => {
    const attorneyDetails = attorneyUsers.find(
      (attorney) => attorney.id === values.attorneyId,
    );

    if (!values.dateValue || !attorneyDetails) return;

    const payload = {
      attorneyId: values.attorneyId,
      attorneyDetails,
      clientDetails: buildClientDetails(values.clientDetails),
      existingClient: !!matchedClient,
      representedByPreviousLawyer: values.representedByPreviousLawyer,
      date: dayjs(values.dateValue).format("YYYY-MM-DD"),
      time: values.time,
      message: values.message.trim(),
      via: values.via,
      areas: values.areas,
      consultationMode: values.consultationMode,
      branch:
        values.consultationMode === "in-person" ? values.branch : undefined,
    };

    const mutation = booking
      ? manualUpdateBookingFn({ id: booking.id, ...payload })
      : manualBookNewAppointmentFn(payload);

    mutation
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: booking
            ? "Appointment updated successfully"
            : "Appointment added successfully",
          message: booking
            ? "The appointment has been updated successfully"
            : "The appointment has been added successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: booking
            ? "Failed to update appointment"
            : "Failed to add appointment",
          message: booking
            ? "The appointment could not be updated. Please try again."
            : "The appointment could not be added. Please try again.",
        });
      });
  };

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (!booking || !opened) return;

    form.setValues({
      attorneyId: booking.attorneyId || booking.attorneyDetails?.id || "",
      attorneyDetails: booking.attorneyDetails || undefined,
      clientDetails: normalizeClientDetails(
        booking.clientDetails,
        booking.clientDetails.email || "",
      ),
      existingClient: booking.existingClient,
      dateValue: new Date(booking.date),
      date: booking.date,
      time: dayjs(`2000-01-01 ${booking.time}`).format("HH:mm"),
      message: booking.message,
      via: booking.via,
      areas: booking.areas || [],
      consultationMode: booking.consultationMode || "in-person",
      branch: booking.branch || "",
      representedByPreviousLawyer: !!booking.representedByPreviousLawyer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, opened]);

  const isLoading = isSaving || isUpdating || isFetchingUsers;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title={booking ? "Update Appointment" : "Add Appointment"}
      size="xl"
      closable={!isLoading}
      type="success"
    >
      {!booking && (
        <Alert
          mb="sm"
          color="blue"
          variant="light"
          styles={(theme) => ({
            title: { fontWeight: 600, color: theme.colors.blue[7] },
            message: { color: theme.colors.blue[7] },
            body: { gap: 2 },
            root: { paddingBlock: 12 },
          })}
          icon={<IconInfoCircle />}
          title="Important note in manually adding appointments"
        >
          <Text size="xs">
            When adding appointments manually, the payment status will be set to
            <span style={{ fontWeight: 700 }}> paid</span> by default. Payments
            under manual appointments will be handled externally and will not be
            tracked in the system.
          </Text>
        </Alert>
      )}

      <FocusTrap.InitialFocus />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">
          <Stack gap="0">
            <Select
              withAsterisk
              searchable
              label="Attorney"
              placeholder="Select Attorney"
              data={attorneyUsers
                .filter((user) => user.id)
                .map((user) => ({
                  value: user.id!,
                  label: user.fullname,
                }))}
              rightSection={isFetchingUsers ? <Loader size="sm" /> : null}
              nothingFoundMessage="No attorneys found"
              {...form.getInputProps("attorneyId")}
            />

            {shouldShowAttorneyDateNotice && (
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
                  Attorney&apos;s Booked Times and Matter Schedules with this
                  date
                </Text>
                <TableScrollContainer mah={400} minWidth={200}>
                  <Table withRowBorders style={{ borderRadius: 8 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th fz="xs">Type</Table.Th>
                        <Table.Th fz="xs">Time</Table.Th>
                        <Table.Th fz="xs">Client / Schedule</Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {isFetchingMatterSchedules && (
                        <Table.Tr>
                          <Table.Td colSpan={3}>
                            <Group gap="xs">
                              <Loader size="xs" />
                              <Text size="xs" c="dimmed">
                                Checking matter schedules
                              </Text>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )}

                      {attyBookings.map((bookingItem) => (
                        <Table.Tr key={bookingItem.id}>
                          <Table.Td fw={600} fz="xs">
                            Appointment
                          </Table.Td>
                          <Table.Td fw={600} fz="xs">
                            <TimeValue value={bookingItem.time} format="12h" />
                          </Table.Td>
                          <Table.Td fw={600} fz="xs">
                            {bookingItem.clientDetails.fullname}
                          </Table.Td>
                        </Table.Tr>
                      ))}

                      {attorneyMatterSchedules.map((schedule) => (
                        <Table.Tr key={schedule.id}>
                          <Table.Td fw={600} fz="xs">
                            Matter schedule
                          </Table.Td>
                          <Table.Td fw={600} fz="xs">
                            <TimeValue value={schedule.time} format="12h" />
                          </Table.Td>
                          <Table.Td fw={600} fz="xs">
                            {schedule.title}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </TableScrollContainer>
              </Alert>
            )}
          </Stack>

          <Stack gap="xs">
            <SimpleGrid
              cols={isMobile ? 1 : 2}
              verticalSpacing={isMobile ? "2px" : "md"}
            >
              <TextInput
                withAsterisk
                label="Full Name"
                placeholder="Enter Full Name"
                {...form.getInputProps("clientDetails.fullname")}
              />

              <Autocomplete
                withAsterisk
                label="Email"
                placeholder="Enter or search email"
                data={clientEmailOptions}
                value={form.values.clientDetails.email || ""}
                onChange={fillClientFromEmail}
                rightSection={isFetchingUsers ? <Loader size="sm" /> : null}
              />

              <NumberInput
                withAsterisk
                hideControls
                label="Phone Number"
                maxLength={10}
                placeholder="912 345 6789"
                leftSection={
                  <Text size="sm" c="dimmed">
                    +63
                  </Text>
                }
                allowNegative={false}
                {...form.getInputProps("clientDetails.phone")}
              />
              <DatePickerInput
                label="Birthday"
                placeholder="Select Birthday"
                clearable
                valueFormat="YYYY-MM-DD"
                value={form.values.clientDetails.birthday || null}
                onChange={(value) => {
                  form.setFieldValue(
                    "clientDetails.birthday",
                    value ? new Date(value) : null,
                  );
                }}
              />
              <TextInput
                label="Full Address"
                placeholder="Enter Full Address"
                style={{ gridColumn: isMobile ? undefined : "1 / -1" }}
                {...form.getInputProps("clientDetails.fullAddress")}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="xs">
            <SimpleGrid
              cols={isMobile ? 1 : 2}
              verticalSpacing={isMobile ? "2px" : "md"}
            >
              <DatePickerInput
                withAsterisk
                label="Date"
                placeholder="Select Date"
                clearable
                hideOutsideDates
                value={form.values.dateValue}
                onChange={(value) => {
                  const dateValue = value ? new Date(value) : null;

                  form.setFieldValue("dateValue", dateValue);
                  form.setFieldValue(
                    "date",
                    dateValue ? dayjs(dateValue).format("YYYY-MM-DD") : "",
                  );
                }}
              />

              <Select
                withAsterisk
                label="Time"
                placeholder="Select Time"
                data={times.map((time) => ({
                  value: time.value,
                  label: time.label,
                  disabled: attyBookings.some(
                    (bookingItem) => bookingItem.time === time.value,
                  ),
                }))}
                {...form.getInputProps("time")}
              />
            </SimpleGrid>

            <Radio.Group
              name="consultationMode"
              label="Consultation Type"
              withAsterisk
              {...form.getInputProps("consultationMode")}
            >
              <Group mt="xs">
                <Radio value="in-person" label="In person consultation" />
                <Radio value="online" label="Online consultation" />
              </Group>
            </Radio.Group>

            {form.values.consultationMode === "in-person" && (
              <Select
                withAsterisk
                label="Branch"
                placeholder="Select Branch"
                data={[
                  { value: "Angeles branch", label: "Angeles branch" },
                  { value: "Magalang branch", label: "Magalang branch" },
                ]}
                {...form.getInputProps("branch")}
              />
            )}
          </Stack>

          <Stack gap="xs">
            <Select
              withAsterisk
              label="Via"
              clearable={false}
              placeholder="Select Via"
              data={[
                "Website",
                "Phone Call",
                "Email",
                "Walk-in",
                "Facebook",
                "Referral",
                "Others",
              ]}
              {...form.getInputProps("via")}
            />

            <TagsInput
              withAsterisk
              label="Areas"
              placeholder="Select Areas"
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

            <Textarea
              withAsterisk
              label="Description"
              placeholder="Enter description"
              minRows={6}
              autosize
              {...form.getInputProps("message")}
            />

            <Checkbox
              label="Represented by previous lawyer"
              {...form.getInputProps("representedByPreviousLawyer", {
                type: "checkbox",
              })}
            />
          </Stack>

          <Group justify="end" mt="md">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSaving || isUpdating}
              disabled={
                isLoading ||
                !form.values.attorneyId ||
                !form.values.dateValue ||
                !form.values.time ||
                !form.values.message ||
                !form.values.via ||
                !form.values.areas.length ||
                (form.values.consultationMode === "in-person" &&
                  !form.values.branch) ||
                !form.isValid()
              }
            >
              {booking ? "Update Appointment" : "Add Appointment"}
            </Button>
          </Group>
        </Stack>
      </form>
    </AppModal>
  );
}
