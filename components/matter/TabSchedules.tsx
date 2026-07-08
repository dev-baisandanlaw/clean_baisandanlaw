import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCalendar,
  IconCirclePlus,
  IconMapPin,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { TimeValue } from "@mantine/dates";
import { Matter, MatterSchedule } from "@/types/matter";
import BasicCard from "../Common/BasicCard";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SpoilerComp from "../Common/SpoilerComp";
import { useDisclosure } from "@mantine/hooks";
import { useMemo, useState } from "react";
import TabScheduleUpsertScheduleModal from "./modals/TabScheduleUpsertScheduleModal";
import TabScheduleDeleteScheduleModal from "./modals/TabScheduleDeleteScheduleModal";

interface TabSchedulesProps {
  matterData: Matter | null;
}

const EMPTY_SCHEDULES: MatterSchedule[] = [];

export default function TabSchedules({ matterData }: TabSchedulesProps) {
  const { user } = useUser();

  const [selectedSchedule, setSelectedSchedule] =
    useState<MatterSchedule | null>(null);
  const [
    isUpsertScheduleModalOpen,
    { open: openUpsertScheduleModal, close: closeUpsertScheduleModal },
  ] = useDisclosure(false);
  const [
    isDeleteScheduleModalOpen,
    { open: openDeleteScheduleModal, close: closeDeleteScheduleModal },
  ] = useDisclosure(false);

  const canManageSchedules = user?.unsafeMetadata?.role === "admin";
  const schedules = matterData?.schedules ?? EMPTY_SCHEDULES;
  const { upcomingSchedules, pastSchedules } = useMemo(() => {
    const sortedSchedules = [...schedules].sort(
      (a, b) =>
        getScheduleDateTime(a).valueOf() - getScheduleDateTime(b).valueOf(),
    );

    return {
      upcomingSchedules: sortedSchedules.filter((schedule) =>
        isScheduleUpcoming(schedule),
      ),
      pastSchedules: sortedSchedules
        .filter((schedule) => !isScheduleUpcoming(schedule))
        .reverse(),
    };
  }, [schedules]);

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    openUpsertScheduleModal();
  };

  const handleEditSchedule = (schedule: MatterSchedule) => {
    setSelectedSchedule(schedule);
    openUpsertScheduleModal();
  };

  const handleDeleteSchedule = (schedule: MatterSchedule) => {
    setSelectedSchedule(schedule);
    openDeleteScheduleModal();
  };

  return (
    <>
      <Stack>
        <BasicCard
          title="Schedules"
          actionButton={
            canManageSchedules && (
              <Button
                leftSection={<IconCirclePlus size={18} />}
                size="xs"
                variant="outline"
                onClick={handleAddSchedule}
              >
                Add Schedule
              </Button>
            )
          }
        >
          {schedules.length > 0 ? (
            <Stack gap="xl">
              <ScheduleSection
                title="Upcoming"
                schedules={upcomingSchedules}
                canManage={canManageSchedules}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
              />
              <ScheduleSection
                title="Past"
                schedules={pastSchedules}
                canManage={canManageSchedules}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
              />
            </Stack>
          ) : (
            <Center h={200}>
              <Text c="dimmed">No schedules found</Text>
            </Center>
          )}
        </BasicCard>
      </Stack>

      {matterData && (
        <TabScheduleUpsertScheduleModal
          opened={isUpsertScheduleModalOpen}
          onClose={closeUpsertScheduleModal}
          matterData={matterData}
          schedule={selectedSchedule}
        />
      )}

      <TabScheduleDeleteScheduleModal
        opened={isDeleteScheduleModalOpen}
        onClose={closeDeleteScheduleModal}
        schedule={selectedSchedule}
      />
    </>
  );
}

const getScheduleDateTime = (schedule: MatterSchedule) =>
  dayjs(`${schedule.date} ${schedule.time}`);

const isScheduleUpcoming = (schedule: MatterSchedule) =>
  getScheduleDateTime(schedule).diff(dayjs(), "minute") > 0;

const ScheduleSection = ({
  title,
  schedules,
  canManage,
  onEdit,
  onDelete,
}: {
  title: string;
  schedules: MatterSchedule[];
  canManage: boolean;
  onEdit: (schedule: MatterSchedule) => void;
  onDelete: (schedule: MatterSchedule) => void;
}) => (
  <Stack gap="sm">
    <Group justify="space-between">
      <Text size="sm" fw={700}>
        {title}
      </Text>
      <Badge variant="light" color={title === "Upcoming" ? "blue" : "green"}>
        {schedules.length}
      </Badge>
    </Group>

    {schedules.length > 0 ? (
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3 }}>
        {schedules.map((schedule) => (
          <ScheduleCard
            schedule={schedule}
            key={schedule.id}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Text size="sm" c="dimmed">
        No {title.toLowerCase()} schedules found
      </Text>
    )}
  </Stack>
);

const ScheduleCard = ({
  schedule,
  canManage,
  onEdit,
  onDelete,
}: {
  schedule: MatterSchedule | undefined;
  canManage: boolean;
  onEdit: (schedule: MatterSchedule) => void;
  onDelete: (schedule: MatterSchedule) => void;
}) => {
  if (!schedule) return;

  const scheduleBadge = () => {
    const isUpcoming = isScheduleUpcoming(schedule);
    return (
      <Badge
        variant="filled"
        size="xs"
        color={isUpcoming ? "blue" : "green"}
        radius="xs"
      >
        {isUpcoming ? "Upcoming" : "Past"}
      </Badge>
    );
  };

  return (
    <Card withBorder radius="sm" p="md">
      <Card.Section p="sm">
        <Stack gap="xs">
          <Group wrap="nowrap" justify="space-between">
            <Group gap="xs">
              <Text size="sm" fw={700}>
                {schedule.title}
              </Text>
              {scheduleBadge()}
            </Group>
            {canManage && (
              <Group gap={2}>
                <ActionIcon
                  variant="subtle"
                  color="#D4AF37"
                  size="sm"
                  ml={12}
                  onClick={() => onEdit(schedule)}
                >
                  <IconPencil size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => onDelete(schedule)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            )}
          </Group>
          <Stack gap={4}>
            <Group gap={4} wrap="nowrap">
              <IconCalendar size={14} />
              <Text size="xs">
                {getDateFormatDisplay(schedule.date)}
                {", "}
                <TimeValue value={schedule.time} format="12h" />
              </Text>
            </Group>

            <Group gap={4} wrap="nowrap">
              <IconMapPin size={14} />
              <Text size="xs">{schedule.location}</Text>
            </Group>
          </Stack>
        </Stack>
      </Card.Section>

      <Divider mb="md" />

      <SpoilerComp>{schedule.description}</SpoilerComp>
    </Card>
  );
};
