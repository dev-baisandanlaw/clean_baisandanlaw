import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCalendar,
  IconCirclePlus,
  IconClock,
  IconLabel,
  IconMap,
  IconMapPin,
  IconNotes,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import EmptyTableComponent from "../EmptyTableComponent";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { TimeValue } from "@mantine/dates";
import { Matter, MatterSchedule } from "@/types/matter";
import BasicCard from "../Common/BasicCard";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SpoilerComp from "../Common/SpoilerComp";
import TabScheduleUpsertModal from "./modals/TabScheduleUpsertModal";

interface TabSchedulesProps {
  matterData: Matter | null;
}

export default function TabSchedules({ matterData }: TabSchedulesProps) {
  const { user } = useUser();

  const [selectedSchedule, setSelectedSchedule] =
    useState<MatterSchedule | null>(null);

  const [schedModal, { open: openSchedModal, close: closeSchedModal }] =
    useDisclosure(false);

  return (
    <>
      <Stack>
        <BasicCard
          title="Schedules"
          actionButton={
            user?.unsafeMetadata?.role !== "client" && (
              <Button
                leftSection={<IconCirclePlus />}
                size="xs"
                variant="outline"
                // onClick={() => handleSelectSchedule(null)}
              >
                Add Schedule
              </Button>
            )
          }
        >
          {matterData?.schedules && matterData?.schedules?.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3 }}>
              {matterData.schedules.map((schedule) => (
                <ScheduleCard schedule={schedule} key={schedule.id} />
              ))}
            </SimpleGrid>
          ) : (
            <Table>
              <Table.Tbody>
                <EmptyTableComponent
                  colspan={12}
                  message="No schedules found"
                />
              </Table.Tbody>
            </Table>
          )}
          {/* <Stack>
          {matterData.schedules &&
            matterData.schedules.length > 0 &&
            matterData.schedules
              .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
              .map((schedule) => (
                <ScheduleDetailsCard
                  key={schedule.scheduleId}
                  schedule={schedule}
                />
              ))}
        </Stack>

        {(!matterData.schedules || matterData.schedules?.length === 0) && (
          <Table>
            <Table.Tbody>
              <EmptyTableComponent colspan={12} message="No schedules found" />
            </Table.Tbody>
          </Table>
        )}
      </Card>
      </Stack>*/}

          {/* <TabScheduleUpsertModal
            opened={schedModal}
            onClose={closeSchedModal}
            schedule={selectedSchedule}
            setDataChanged={setDataChanged}
            matterData={matterData}
          /> */}
        </BasicCard>
      </Stack>
    </>
  );
}

const ScheduleCard = ({
  schedule,
}: {
  schedule: MatterSchedule | undefined;
}) => {
  if (!schedule) return;

  const scheduleBadge = () => {
    const diff = dayjs(`${schedule.date} ${schedule.time}`).diff(
      dayjs(),
      "minute",
    );
    const isUpcoming = diff > 0;
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
            <Group gap={2}>
              <ActionIcon variant="outline" color="blue" size="xs" ml={12}>
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon variant="outline" color="red" size="xs">
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
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
