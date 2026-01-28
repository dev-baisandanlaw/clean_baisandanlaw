import { COLLECTIONS, WORK_SCHEDULE } from "@/constants/constants";
import {
  REGULAR_HOLIDAYS,
  SPECIAL_HOLIDAYS,
} from "@/constants/non-working-sched";
import {
  Alert,
  Button,
  em,
  Flex,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import SettingsSection from "./SettingsSection";
import { useForm } from "@mantine/form";
import {
  DatePicker,
  getTimeRange,
  TimePicker,
  TimeValue,
} from "@mantine/dates";
import { appNotifications } from "@/utils/notifications/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { GlobalSched } from "@/types/global-sched";
import dayjs from "dayjs";
import { useMediaQuery } from "@mantine/hooks";

const timeSlots = getTimeRange({
  startTime: "08:00",
  endTime: "16:00",
  interval: "01:00",
});

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  globalSched: GlobalSched | null;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function SettingsModal({
  opened,
  onClose,
  globalSched,
  setDataChanged,
}: SettingsModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(600)})`);

  const [acc, setAcc] = useState<string[]>([]);

  const [isSavingHolidays, setIsSavingHolidays] = useState(false);
  const [isSavingBlockedSchedules, setIsSavingBlockedSchedules] =
    useState(false);

  const handleAccordion = (key: string) => {
    setAcc((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const holidaysForm = useForm({
    initialValues: {
      regularHolidays: {
        "new-year": false,
        kagitingan: false,
        "labor-day": false,
        "independence-day": false,
        "bonifacio-day": false,
        "christmas-day": false,
        "rizal-day": false,
      },
      specialHolidays: {
        edsa: false,
        ninoy: false,
        "all-saints-eve": false,
        "all-saints": false,
        "immaculate-conception": false,
        "christmas-eve": false,
        "last-day": false,
      },
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
      isWholeDay: false,
    },
  });

  useEffect(() => {
    if (!globalSched || !opened) return;

    const { regularHolidays, specialHolidays, workSchedule, officeHours } =
      globalSched;

    if (regularHolidays && specialHolidays && workSchedule) {
      holidaysForm.setValues({
        regularHolidays,
        specialHolidays,
        workSchedule,
        officeHours,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSched, opened]);

  useEffect(() => {
    if (globalSched?.blockedDates?.[blockedDatesForm.values.selectedDate]) {
      blockedDatesForm.setFieldValue(
        "selectedTimeSlots",
        globalSched.blockedDates[blockedDatesForm.values.selectedDate],
      );
    } else {
      blockedDatesForm.setFieldValue("selectedTimeSlots", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedDatesForm.values.selectedDate, globalSched]);

  const regularHolidaysCount = `${Object?.values(holidaysForm.values.regularHolidays)?.filter(Boolean).length}/${REGULAR_HOLIDAYS.length}`;
  const specialHolidaysCount = `${Object?.values(holidaysForm.values.specialHolidays)?.filter(Boolean).length}/${SPECIAL_HOLIDAYS.length}`;
  const workScheduleCount = `${Object?.values(holidaysForm.values.workSchedule)?.filter(Boolean).length}/${WORK_SCHEDULE.length}`;

  const handleSaveHolidays = async () => {
    const { officeStart, officeEnd } = holidaysForm.values.officeHours;

    if (toMinutes(officeStart) >= toMinutes(officeEnd)) {
      appNotifications.error({
        title: "An error occurred",
        message: "Office Start Time should be less than Office End Time",
      });
      return;
    }

    setIsSavingHolidays(true);

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.GLOBAL_SCHED,
          process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
        ),
        {
          ...holidaysForm.values,
        },
        { merge: true },
      );

      appNotifications.success({
        title: "Settings saved successfully",
        message:
          "The holidays, work schedule, and Office hour settings have been saved successfully",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to save settings",
        message:
          "The holidays, work schedule, and office hours could not be saved. Please try again.",
      });
    } finally {
      setIsSavingHolidays(false);
    }
  };

  const handleSaveBlockedSchedules = async () => {
    setIsSavingBlockedSchedules(true);

    try {
      const blockedDates = { ...globalSched?.blockedDates };
      if (blockedDatesForm.values.selectedTimeSlots.length) {
        blockedDates[blockedDatesForm.values.selectedDate] =
          blockedDatesForm.values.selectedTimeSlots;
      } else {
        delete blockedDates[blockedDatesForm.values.selectedDate];
      }

      await setDoc(
        doc(
          db,
          COLLECTIONS.GLOBAL_SCHED,
          process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
        ),
        {
          ...(globalSched ?? {}),
          blockedDates,
        },
      );
      appNotifications.success({
        title: "Blocked schedules saved successfully",
        message: "The blocked schedules have been saved successfully",
      });
      setDataChanged((prev) => !prev);
    } catch {
      appNotifications.error({
        title: "Failed to save blocked schedules",
        message: "The blocked schedules could not be saved. Please try again.",
      });
    } finally {
      setIsSavingBlockedSchedules(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Calendar Settings"
      centered
      size="xl"
      withCloseButton={!isSavingHolidays && !isSavingBlockedSchedules}
    >
      <Tabs defaultValue="holidays-work-sched">
        <Tabs.List>
          <Tabs.Tab value="holidays-work-sched" flex={1}>
            Holidays and work schedule
          </Tabs.Tab>
          <Tabs.Tab value="block-schedules" flex={1}>
            Blocked schedules
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
              items={REGULAR_HOLIDAYS}
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
              items={SPECIAL_HOLIDAYS}
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
              items={WORK_SCHEDULE}
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
                disabled={isSavingHolidays}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveHolidays}
                loading={isSavingHolidays}
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
                onClick={handleSaveBlockedSchedules}
                loading={isSavingBlockedSchedules}
              >
                Save
              </Button>

              <SimpleGrid cols={3} spacing="xs">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    size="compact-sm"
                    style={{
                      userSelect: isSavingBlockedSchedules ? "none" : "auto",
                      pointerEvents: isSavingBlockedSchedules ? "none" : "auto",
                      cursor: isSavingBlockedSchedules
                        ? "not-allowed"
                        : "pointer",
                    }}
                    variant={
                      blockedDatesForm.values.selectedTimeSlots?.includes(slot)
                        ? "filled"
                        : "outline"
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
                  ...Object.entries(globalSched?.blockedDates || {})
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([date, timeSlots]) => [
                      date,
                      <Group key={date} gap="2">
                        {timeSlots
                          .sort((a, b) => a.localeCompare(b))
                          .map((s, i) => (
                            <Text key={s} size="xs" mr={2}>
                              <TimeValue value={s} format="12h" />
                              {i !== timeSlots.length - 1 && ","}
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
      </Tabs>
    </Modal>
  );
}
