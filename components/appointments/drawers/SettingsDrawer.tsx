import {
  Drawer,
  Stack,
  Text,
  Checkbox,
  Badge,
  Group,
  ActionIcon,
  Modal,
  Alert,
  Radio,
  ScrollArea,
  SimpleGrid,
  Button,
  LoadingOverlay,
  Select,
} from "@mantine/core";
import {
  COLLECTIONS,
  HOUR_INTERVAL,
  REGULAR_HOLIDAYS,
  SPECIAL_HOLIDAYS,
  WORK_SCHEDULE,
} from "@/constants/constants";
import dayjs from "dayjs";
import {
  DateFormatter,
  DatePickerInput,
  getTimeRange,
  TimeValue,
} from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "react-toastify";
import { GlobalSettings } from "@/types/global-settings";

const fixedTimeSlots = getTimeRange({
  startTime: "00:00",
  endTime: "23:45",
  interval: "00:15",
});

export default function SettingsDrawer({
  opened,
  onClose,
  settings,
  fetchData,
  // loading,
}: {
  opened: boolean;
  onClose: () => void;
  settings: GlobalSettings | null;
  fetchData: () => void;
  // loading: boolean;
}) {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;

    const {
      specificDates,
      regularHolidays = {},
      specialHolidays = {},
      workSchedule = {},
      hourInterval,
      specificDatesTime,
      startOfDay,
      endOfDay,
    } = settings;

    const mergedRegularHolidays = REGULAR_HOLIDAYS.reduce(
      (acc, holiday) => {
        acc[holiday.id] = regularHolidays[holiday.id] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const mergedSpecialHolidays = SPECIAL_HOLIDAYS.reduce(
      (acc, holiday) => {
        acc[holiday.id] = specialHolidays[holiday.id] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const mergedWorkSchedule = WORK_SCHEDULE.reduce(
      (acc, day) => {
        acc[day.name] = workSchedule[day.name] ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );

    form.setValues({
      specificDates,
      regularHolidays: mergedRegularHolidays,
      specialHolidays: mergedSpecialHolidays,
      workSchedule: mergedWorkSchedule,
      hourInterval,
      specificDatesTime: specificDatesTime || {},
      startOfDay: startOfDay || "08:00:00",
      endOfDay: endOfDay || "17:00:00",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSaveSettings = () => {
    setIsSaving(true);

    setDoc(
      doc(
        db,
        COLLECTIONS.GLOBAL_SETTINGS,
        process.env.NEXT_PUBLIC_FIREBASE_SETTINGS_ID!
      ),
      {
        ...form.values,
      },
      { merge: true }
    )
      .then(() => {
        fetchData();
        toast.success("Settings saved successfully");
        onClose();
      })
      .catch(() => toast.error("Failed to save settings"))
      .finally(() => setIsSaving(false));
  };

  const form = useForm({
    initialValues: {
      specificDates: [] as string[],
      regularHolidays: {},
      specialHolidays: {},
      workSchedule: {},
      hourInterval: "00:30",
      specificDatesTime: {} as Record<string, string[]>,
      startOfDay: "",
      endOfDay: "",
    },
  });

  const handleRemoveSelectedDate = (value: string) => {
    const { specificDatesTime } = form.values;

    if (specificDatesTime.hasOwnProperty(value)) {
      const updated = { ...specificDatesTime };
      delete updated[value];

      form.setFieldValue("specificDatesTime", updated);
    }

    form.setFieldValue(
      "specificDates",
      form.values.specificDates.filter((v) => v !== value)
    );
  };

  // modal
  const [
    isDayTimeModalOpen,
    { open: openDayTimeModal, close: closeDayTimeModal },
  ] = useDisclosure(false);

  const [selectedSpecificDate, setSelectedSpecificDate] = useState<
    string | null
  >(null);

  const timeSlots = useMemo(() => {
    return getTimeRange({
      startTime: "08:00",
      endTime: "17:00",
      interval: form.values.hourInterval || "00:30",
    });
  }, [form.values.hourInterval]);

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title="Calendar Settings"
        position="top"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        size="100%"
        withCloseButton={!isSaving}
      >
        {/* <LoadingOverlay visible={loading} /> */}
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 5 }}
          w="100%"
          h="100%"
          spacing="lg"
        >
          <Stack gap={4}>
            <Text fw={600} mb={2}>
              Specific Date
            </Text>

            <Stack gap={4} mb={8}>
              <DatePickerInput
                label="Select Dates"
                placeholder="Select Dates"
                type="multiple"
                mb={8}
                valueFormatter={formatter}
                {...form.getInputProps("specificDates")}
              />

              <Group gap={3}>
                {form.values.specificDates.map((date) => (
                  <CustomBadge
                    text={dayjs(date).format("MMM D YYYY")}
                    key={date}
                    timeSlots={form.values.specificDatesTime[date as string]}
                    isSpecificDate
                    onRemove={() => handleRemoveSelectedDate(date)}
                    onBadgeClick={() => {
                      setSelectedSpecificDate(date);
                      setSelectedTimeSlots(
                        form.values.specificDatesTime[date] || []
                      );
                      openDayTimeModal();
                    }}
                  />
                ))}
              </Group>
            </Stack>
          </Stack>

          <Stack gap={4}>
            <Text fw={600}>Regular Holidays</Text>
            <Stack gap={4}>
              {REGULAR_HOLIDAYS.map((holiday) => (
                <Checkbox
                  size="xs"
                  key={holiday.date}
                  label={
                    <Stack gap={0}>
                      <Text size="xs" fw={500}>
                        {holiday.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(holiday.date).format("MMM D")}
                      </Text>
                    </Stack>
                  }
                  styles={{ body: { alignItems: "center" } }}
                  {...form.getInputProps(`regularHolidays.${holiday.id}`, {
                    type: "checkbox",
                  })}
                />
              ))}
            </Stack>
          </Stack>

          <Stack gap={4}>
            <Text fw={600}>Special Holidays</Text>
            <Stack gap={4}>
              {SPECIAL_HOLIDAYS.map((holiday) => (
                <Checkbox
                  size="xs"
                  key={holiday.date}
                  label={
                    <Stack gap={0}>
                      <Text size="xs" fw={500}>
                        {holiday.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(holiday.date).format("MMM D")}
                      </Text>
                    </Stack>
                  }
                  styles={{ body: { alignItems: "center" } }}
                  {...form.getInputProps(`specialHolidays.${holiday.id}`, {
                    type: "checkbox",
                  })}
                />
              ))}
            </Stack>
          </Stack>

          <Stack gap={4}>
            <Text fw={600}>Work Schedule</Text>
            <Stack gap={4} mb={8}>
              {WORK_SCHEDULE.map((workSchedule) => (
                <Checkbox
                  size="xs"
                  key={workSchedule.value}
                  label={workSchedule.name}
                  {...form.getInputProps(`workSchedule.${workSchedule.name}`, {
                    type: "checkbox",
                  })}
                />
              ))}
            </Stack>

            <Text fw={600}>Hour Interval</Text>
            <Radio.Group {...form.getInputProps("hourInterval")}>
              {HOUR_INTERVAL.map((hourInterval) => (
                <Radio
                  my={2}
                  size="xs"
                  key={hourInterval.value}
                  label={hourInterval.name}
                  value={hourInterval.value}
                  styles={{ radio: { cursor: "pointer" } }}
                />
              ))}
            </Radio.Group>
          </Stack>

          <Stack gap={4}>
            <Text fw={600}>Start of Day</Text>
            <Select
              searchable
              data={fixedTimeSlots}
              {...form.getInputProps("startOfDay")}
            />

            <Text fw={600}>End of Day</Text>
            <Select
              searchable
              disabled={!form.values.startOfDay}
              data={fixedTimeSlots.filter(
                (slot) => slot > form.values.startOfDay
              )}
              {...form.getInputProps("endOfDay")}
            />
          </Stack>
        </SimpleGrid>

        <Button
          fullWidth
          onClick={handleSaveSettings}
          mt={32}
          loading={isSaving}
        >
          Save
        </Button>
      </Drawer>

      <Modal
        opened={isDayTimeModalOpen}
        onClose={closeDayTimeModal}
        title={`Select Time to Disable for ${dayjs(selectedSpecificDate).format(
          "MMM D YYYY"
        )}`}
        size="lg"
      >
        <Alert
          title="Note"
          icon={<IconInfoCircle />}
          mb="sm"
          styles={(theme) => ({
            title: {
              fontWeight: 700,
              color: theme.colors.blue[4],
              marginBottom: -8,
            },
            icon: { color: theme.colors.blue[4] },
            message: {
              color: theme.colors.blue[4],
              textAlign: "justify",
              paddingRight: 16,
            },
            root: {
              backgroundColor: theme.colors.blue[0],
              boxShadow: theme.other.customBoxShadow,
              borderRadius: 10,
            },
          })}
        >
          <Text size="sm">
            If there&apos;s no selected time, the whole day will be disabled
          </Text>
        </Alert>
        <ScrollArea h={300} offsetScrollbars>
          <SimpleGrid cols={3} spacing="xs">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
                size="sm"
                variant={
                  selectedTimeSlots.includes(slot) ? "filled" : "outline"
                }
                onClick={() =>
                  setSelectedTimeSlots((prev) =>
                    prev.includes(slot)
                      ? prev.filter((s) => s !== slot)
                      : [...prev, slot]
                  )
                }
              >
                <TimeValue value={slot} format="12h" />
              </Button>
            ))}
          </SimpleGrid>
        </ScrollArea>

        <Group mt="md">
          <Button
            variant="outline"
            onClick={() => setSelectedTimeSlots([])}
            mr="auto"
          >
            Clear
          </Button>
          <Button variant="outline" onClick={closeDayTimeModal}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              form.setFieldValue(
                `specificDatesTime.${selectedSpecificDate}`,
                selectedTimeSlots
              );
              closeDayTimeModal();
            }}
          >
            Save
          </Button>
        </Group>
      </Modal>
    </>
  );
}

const formatter: DateFormatter = ({ type, date, locale, format }) => {
  if (type === "multiple" && Array.isArray(date)) {
    if (date.length === 1) {
      return dayjs(date[0]).locale(locale).format(format);
    }

    if (date.length > 1) {
      return `${date.length} dates selected`;
    }

    return "";
  }

  return "";
};

const CustomBadge = ({
  text,
  onRemove,
  onBadgeClick,
  timeSlots,
  isSpecificDate = false,
}: {
  text: string;
  onRemove: () => void;
  onBadgeClick?: () => void;
  timeSlots?: string[];
  isSpecificDate?: boolean;
}) => {
  return (
    <Badge
      variant="filled"
      size="xs"
      onClick={onBadgeClick}
      radius="sm"
      style={{ cursor: onBadgeClick ? "pointer" : "default" }}
    >
      <Group gap={2}>
        <Group gap={2}>
          {!isSpecificDate && text}
          {isSpecificDate &&
            (timeSlots && timeSlots.length > 0
              ? text + ` (${timeSlots.length} time slots)`
              : text + ` (whole day)`)}
        </Group>
        <ActionIcon
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <IconX size={12} color="white" />
        </ActionIcon>
      </Group>
    </Badge>
  );
};
