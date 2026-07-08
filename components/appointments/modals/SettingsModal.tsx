import {
  ActionIcon,
  Alert,
  Button,
  em,
  Flex,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import SettingsSection from "./SettingsSection";
import { useForm } from "@mantine/form";
import {
  DatePicker,
  getTimeRange,
  TimePicker,
  TimeValue,
} from "@mantine/dates";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  IconCheck,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMediaQuery } from "@mantine/hooks";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import AppModal from "@/components/Common/modal/AppModal";
import {
  type BookingSettings,
  type HolidaySetting,
  type PaymentChannelSetting,
  type UpdateBookingSettingsDto,
} from "@/types/bookingSettings";
import { useUpdateBookingSettingsMutation } from "@/store/services/bookingService";

const toHolidayRecord = (holidays: HolidaySetting[] = []) =>
  Object.fromEntries(holidays.map((holiday) => [holiday.id, holiday.enabled]));

const toHolidayItems = (holidays: HolidaySetting[] = []) =>
  holidays.map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    date: holiday.date.replace("-", "/"),
  }));

const formatWorkDayName = (day: string) =>
  day.charAt(0).toUpperCase() + day.slice(1);

const WORK_SCHEDULE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const getPaymentChannelId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `payment-channel-${Date.now()}`;

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  bookingSettings?: BookingSettings;
}

export default function SettingsModal({
  opened,
  onClose,
  bookingSettings,
}: SettingsModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(600)})`);
  const [updateBookingSettings, { isLoading: isSaving }] =
    useUpdateBookingSettingsMutation();

  const [acc, setAcc] = useState<string[]>([]);

  const handleAccordion = (key: string) => {
    setAcc((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const holidaysForm = useForm({
    initialValues: {
      regularHolidays: {} as Record<string, boolean>,
      specialHolidays: {} as Record<string, boolean>,
      officeHours: {
        officeStart: "08:00",
        officeEnd: "17:00",
        bookingInterval: "01:00",
      },
      workSchedule: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    },
  });

  const blockedDatesForm = useForm({
    initialValues: {
      selectedDate: dayjs().format("YYYY-MM-DD"),
      selectedTimeSlots: [] as string[],
    },
  });

  const paymentsForm = useForm({
    initialValues: {
      appointmentFeePerHour: 0,
      paymentChannels: [] as PaymentChannelSetting[],
    },
  });

  const timeSlots = useMemo(
    () =>
      getTimeRange({
        startTime: holidaysForm.values.officeHours.officeStart,
        endTime: holidaysForm.values.officeHours.officeEnd,
        interval: holidaysForm.values.officeHours.bookingInterval,
      }),
    [
      holidaysForm.values.officeHours.bookingInterval,
      holidaysForm.values.officeHours.officeEnd,
      holidaysForm.values.officeHours.officeStart,
    ],
  );

  const regularHolidayItems = useMemo(
    () => toHolidayItems(bookingSettings?.regularHolidays),
    [bookingSettings],
  );

  const specialHolidayItems = useMemo(
    () => toHolidayItems(bookingSettings?.specialHolidays),
    [bookingSettings],
  );

  const workScheduleItems = useMemo(
    () =>
      WORK_SCHEDULE_DAYS.filter(
        (day) => day in (bookingSettings?.workSchedule ?? {}),
      ).map((day) => ({
        id: day,
        name: formatWorkDayName(day),
      })),
    [bookingSettings],
  );

  useEffect(() => {
    if (!bookingSettings || !opened) return;

    holidaysForm.setValues({
      regularHolidays: toHolidayRecord(bookingSettings.regularHolidays),
      specialHolidays: toHolidayRecord(bookingSettings.specialHolidays),
      workSchedule: { ...bookingSettings.workSchedule },
      officeHours: {
        officeStart: bookingSettings.officeHourStart,
        officeEnd: bookingSettings.officeHourEnd,
        bookingInterval: bookingSettings.bookingIntervalMinutes,
      },
    });

    paymentsForm.setValues({
      appointmentFeePerHour: Number(bookingSettings.appointmentFeePerHour),
      paymentChannels: bookingSettings.paymentChannels.map((channel) => ({
        ...channel,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingSettings, opened]);

  useEffect(() => {
    const blockedSchedule = bookingSettings?.blockedSchedules.find(
      (schedule) => schedule.date === blockedDatesForm.values.selectedDate,
    );

    blockedDatesForm.setValues({
      selectedDate: blockedDatesForm.values.selectedDate,
      selectedTimeSlots: blockedSchedule ? [...blockedSchedule.timeSlots] : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedDatesForm.values.selectedDate, bookingSettings]);

  const regularHolidaysCount = `${Object?.values(holidaysForm.values.regularHolidays)?.filter(Boolean).length}/${regularHolidayItems.length}`;
  const specialHolidaysCount = `${Object?.values(holidaysForm.values.specialHolidays)?.filter(Boolean).length}/${specialHolidayItems.length}`;
  const workScheduleCount = `${Object?.values(holidaysForm.values.workSchedule)?.filter(Boolean).length}/${workScheduleItems.length}`;

  const buildHolidayPayload = (
    holidays: HolidaySetting[] = [],
    checkedValues: Record<string, boolean>,
  ) =>
    holidays.map((holiday) => ({
      ...holiday,
      enabled: !!checkedValues[holiday.id],
    }));

  const buildBlockedSchedulesPayload = () => {
    const existingSchedule = bookingSettings?.blockedSchedules.find(
      (schedule) => schedule.date === blockedDatesForm.values.selectedDate,
    );
    const otherSchedules =
      bookingSettings?.blockedSchedules.filter(
        (schedule) => schedule.date !== blockedDatesForm.values.selectedDate,
      ) ?? [];

    if (blockedDatesForm.values.selectedTimeSlots.length) {
      return [
        ...otherSchedules,
        {
          id:
            existingSchedule?.id ??
            `blocked-${blockedDatesForm.values.selectedDate}`,
          date: blockedDatesForm.values.selectedDate,
          timeSlots: [...blockedDatesForm.values.selectedTimeSlots].sort(),
          reason: existingSchedule?.reason,
        },
      ];
    }

    return otherSchedules;
  };

  const handleSaveSettings = async ({
    closeAfterSave = true,
  }: {
    closeAfterSave?: boolean;
  } = {}) => {
    if (!bookingSettings) return;

    const { officeStart, officeEnd } = holidaysForm.values.officeHours;

    if (timeToMinutes(officeStart) >= timeToMinutes(officeEnd)) {
      appNotifications.error({
        title: "Failed to save settings",
        message: "Office Start Time should be less than Office End Time",
      });
      return;
    }

    if (
      !paymentsForm.values.appointmentFeePerHour ||
      paymentsForm.values.paymentChannels.some(
        (channel) =>
          !channel.name || !channel.accountName || !channel.accountNumber,
      )
    ) {
      appNotifications.error({
        title: "Error saving payment settings",
        message: !paymentsForm.values.appointmentFeePerHour
          ? "Appointment fee must be at least 1"
          : "Payment channels should include a name, account name, and account number",
      });
      return;
    }

    const payload: UpdateBookingSettingsDto = {
      regularHolidays: buildHolidayPayload(
        bookingSettings.regularHolidays,
        holidaysForm.values.regularHolidays,
      ),
      specialHolidays: buildHolidayPayload(
        bookingSettings.specialHolidays,
        holidaysForm.values.specialHolidays,
      ),
      workSchedule: holidaysForm.values.workSchedule,
      officeHourStart: officeStart,
      officeHourEnd: officeEnd,
      bookingIntervalMinutes: holidaysForm.values.officeHours.bookingInterval,

      blockedSchedules: buildBlockedSchedulesPayload(),
      appointmentFeePerHour: Number(paymentsForm.values.appointmentFeePerHour),
      paymentChannels: paymentsForm.values.paymentChannels.map((channel) => ({
        ...channel,
        name: channel.name.trim(),
        accountName: channel.accountName.trim(),
        accountNumber: channel.accountNumber.trim(),
        enabled: channel.enabled ?? true,
      })),
    };

    try {
      await updateBookingSettings(payload).unwrap();

      appNotifications.success({
        title: "Settings saved successfully",
        message: "The calendar and payment settings have been saved.",
      });

      if (closeAfterSave) onClose();
    } catch {
      appNotifications.error({
        title: "Failed to save settings",
        message: "The settings could not be saved. Please try again.",
      });
    }
  };

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Calendar Settings"
      size="xl"
      closable={!isSaving}
      type="success"
    >
      <Tabs defaultValue="holidays-work-sched">
        <Tabs.List>
          <Tabs.Tab value="holidays-work-sched" flex={1}>
            Holidays and work schedule
          </Tabs.Tab>
          <Tabs.Tab value="block-schedules" flex={1}>
            Blocked schedules
          </Tabs.Tab>
          <Tabs.Tab value="payment-settings" flex={1}>
            Payment Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="holidays-work-sched" pt="md">
          <Stack>
            <SettingsSection
              title="Regular Holidays"
              count={regularHolidaysCount}
              accordionKey="regularHolidays"
              isOpen={acc.includes("regularHolidays")}
              onToggle={handleAccordion}
              items={regularHolidayItems}
              checkedValues={holidaysForm.values.regularHolidays}
              onCheckboxChange={(id, checked) => {
                holidaysForm.setFieldValue(`regularHolidays.${id}`, checked);
              }}
            />

            <SettingsSection
              title="Special Holidays"
              count={specialHolidaysCount}
              accordionKey="specialHolidays"
              isOpen={acc.includes("specialHolidays")}
              onToggle={handleAccordion}
              items={specialHolidayItems}
              checkedValues={holidaysForm.values.specialHolidays}
              onCheckboxChange={(id, checked) => {
                holidaysForm.setFieldValue(`specialHolidays.${id}`, checked);
              }}
            />

            <SettingsSection
              title="Work Schedule"
              count={workScheduleCount}
              accordionKey="workSchedule"
              isOpen={acc.includes("workSchedule")}
              onToggle={handleAccordion}
              items={workScheduleItems}
              checkedValues={holidaysForm.values.workSchedule}
              onCheckboxChange={(name, checked) => {
                holidaysForm.setFieldValue(`workSchedule.${name}`, checked);
              }}
            />

            <Paper withBorder radius="md" p="sm">
              <Group grow>
                <TimePicker
                  onKeyDown={(e) => e.preventDefault()}
                  label="Office Hour Start"
                  withDropdown
                  hoursStep={1}
                  minutesStep={15}
                  size="sm"
                  {...holidaysForm.getInputProps("officeHours.officeStart")}
                />
                <TimePicker
                  onKeyDown={(e) => e.preventDefault()}
                  label="Office Hour End"
                  withDropdown
                  hoursStep={1}
                  minutesStep={15}
                  size="sm"
                  {...holidaysForm.getInputProps("officeHours.officeEnd")}
                />
                <Select
                  {...holidaysForm.getInputProps("officeHours.bookingInterval")}
                  label="Booking interval"
                  size="sm"
                  defaultValue="01:00"
                  clearable={false}
                  allowDeselect={false}
                  data={[
                    {
                      label: "15 minutes",
                      value: "00:15",
                    },
                    {
                      label: "30 minutes",
                      value: "00:30",
                    },
                    {
                      label: "45 minutes",
                      value: "00:45",
                    },
                    {
                      label: "1 hour",
                      value: "01:00",
                    },
                    {
                      label: "2 hours",
                      value: "02:00",
                    },
                    {
                      label: "3 hours",
                      value: "03:00",
                    },
                    {
                      label: "4 hours",
                      value: "04:00",
                    },
                    {
                      label: "5 hours",
                      value: "05:00",
                    },
                  ]}
                />
              </Group>
            </Paper>

            <Group justify="flex-end">
              <Button
                variant="default"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveSettings()}
                loading={isSaving}
                disabled={
                  !holidaysForm.values.officeHours.officeStart ||
                  !holidaysForm.values.officeHours.officeEnd
                }
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="block-schedules" pt="md">
          <Flex
            align={isMobile ? "center" : "flex-start"}
            direction={isMobile ? "column" : "row"}
            gap={8}
          >
            <DatePicker
              size="xs"
              hideOutsideDates
              headerControlsOrder={["level", "previous", "next"]}
              styles={{
                calendarHeaderLevel: { justifyContent: "flex-start" },
                levelsGroup: {
                  display: "flex",
                  justifyContent: "space-between",
                  flexDirection: "column",
                },
              }}
              {...blockedDatesForm.getInputProps("selectedDate")}
            />

            <Stack flex={1}>
              <Alert
                title="Friendly reminder"
                icon={<IconInfoCircle />}
                variant="outline"
                color="orange"
                styles={{ body: { gap: 2 }, title: { fontSize: "12px" } }}
                p={4}
              >
                <Text size="xs">
                  When blocking dates, we recommend to ensure that there are{" "}
                  <Text span fw={600}>
                    no appointments
                  </Text>{" "}
                  scheduled for that date to avoid any conflicts.
                </Text>
              </Alert>

              <Button
                fullWidth
                size="xs"
                onClick={() => handleSaveSettings({ closeAfterSave: false })}
                loading={isSaving}
              >
                Save
              </Button>

              <SimpleGrid cols={3} spacing="xs">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    size="compact-sm"
                    style={{
                      userSelect: isSaving ? "none" : "auto",
                      pointerEvents: isSaving ? "none" : "auto",
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                    variant={
                      blockedDatesForm.values.selectedTimeSlots?.includes(slot)
                        ? "filled"
                        : "outline"
                    }
                    rightSection={
                      blockedDatesForm.values.selectedTimeSlots?.includes(
                        slot,
                      ) ? (
                        <IconCheck size={14} />
                      ) : null
                    }
                    onClick={() => {
                      if (
                        blockedDatesForm.values.selectedTimeSlots.includes(slot)
                      ) {
                        blockedDatesForm.setFieldValue(
                          "selectedTimeSlots",
                          blockedDatesForm.values.selectedTimeSlots.filter(
                            (s) => s !== slot,
                          ),
                        );
                      } else {
                        blockedDatesForm.setFieldValue("selectedTimeSlots", [
                          ...blockedDatesForm.values.selectedTimeSlots,
                          slot,
                        ]);
                      }
                    }}
                  >
                    <TimeValue value={slot} format="12h" />
                  </Button>
                ))}
              </SimpleGrid>
            </Stack>
          </Flex>

          <Paper withBorder p="sm" my="md">
            <Text size="xs" c="dimmed">
              The table below only shows the upcoming blocked dates
            </Text>
            <Table
              data={{
                head: ["Date", "Time Slots"],
                body: [
                  ...[...(bookingSettings?.blockedSchedules ?? [])]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .filter((schedule) =>
                      dayjs(schedule.date).isSameOrAfter(dayjs(), "day"),
                    )
                    .filter((schedule) => schedule.timeSlots.length > 0)
                    .map((schedule) => [
                      getDateFormatDisplay(schedule.date),
                      <Group key={schedule.id} gap="2">
                        {[...schedule.timeSlots]
                          .sort((a, b) => a.localeCompare(b))
                          .map((s, i) => (
                            <Text key={s} size="xs" mr={2}>
                              <TimeValue value={s} format="12h" />
                              {i !== schedule.timeSlots.length - 1 && ","}
                            </Text>
                          ))}
                      </Group>,
                    ]),
                ],
              }}
              styles={{
                th: {
                  fontSize: "12px",
                  padding: "8px 12px",
                  fontWeight: 600,
                },
                td: {
                  fontSize: "12px",
                  padding: "8px 12px",
                },
              }}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="payment-settings" pt="md">
          <Stack>
            <Paper withBorder radius="md" p="sm">
              <NumberInput
                label="Appointment Fee per hour"
                min={1}
                leftSection={
                  <Text size="sm" c="black">
                    ₱
                  </Text>
                }
                hideControls
                thousandSeparator=","
                decimalScale={2}
                placeholder="Enter appointment fee per hour"
                {...paymentsForm.getInputProps("appointmentFeePerHour")}
              />
            </Paper>

            <Paper withBorder radius="md" p="sm">
              <Group justify="space-between">
                <Text size="sm" fw={700}>
                  Payment Channels
                </Text>

                <ActionIcon
                  size="sm"
                  onClick={() => {
                    paymentsForm.insertListItem("paymentChannels", {
                      id: getPaymentChannelId(),
                      name: "",
                      accountName: "",
                      accountNumber: "",
                      enabled: true,
                    });
                  }}
                  disabled={isSaving}
                >
                  <IconPlus />
                </ActionIcon>
              </Group>

              <Stack my="md">
                {paymentsForm.values.paymentChannels.map((_, idx) => {
                  return (
                    <Group align="end" key={idx}>
                      <TextInput
                        flex={1}
                        withAsterisk
                        size="xs"
                        label="Payment Channel Name"
                        placeholder="Gcash, Metrobank, etc."
                        {...paymentsForm.getInputProps(
                          `paymentChannels.${idx}.name`,
                        )}
                      />
                      <TextInput
                        flex={1}
                        withAsterisk
                        size="xs"
                        label="Account Name"
                        placeholder="Enter account name"
                        {...paymentsForm.getInputProps(
                          `paymentChannels.${idx}.accountName`,
                        )}
                      />
                      <TextInput
                        flex={1}
                        withAsterisk
                        size="xs"
                        label="Account Number"
                        placeholder="Enter account number"
                        {...paymentsForm.getInputProps(
                          `paymentChannels.${idx}.accountNumber`,
                        )}
                      />
                      <ActionIcon
                        disabled={
                          paymentsForm.values.paymentChannels.length <= 1 ||
                          isSaving
                        }
                        color="red"
                        size="sm"
                        variant="light"
                        mb="6"
                        onClick={() => {
                          paymentsForm.removeListItem("paymentChannels", idx);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  );
                })}
              </Stack>
            </Paper>

            <Group justify="flex-end">
              <Button
                variant="default"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveSettings()}
                loading={isSaving}
                disabled={
                  !paymentsForm.values.appointmentFeePerHour ||
                  (paymentsForm.values.paymentChannels &&
                    paymentsForm.values.paymentChannels.length > 0 &&
                    paymentsForm.values.paymentChannels.some(
                      (i) => !i.accountName || !i.accountNumber || !i.name,
                    ))
                }
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </AppModal>
  );
}
