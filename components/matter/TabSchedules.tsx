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
  IconCalendar,
  IconCirclePlus,
  IconMapPin,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import EmptyTableComponent from "../EmptyTableComponent";
import { TimeValue } from "@mantine/dates";
import { Matter, MatterSchedule } from "@/types/matter";
import BasicCard from "../Common/BasicCard";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SpoilerComp from "../Common/SpoilerComp";

interface TabSchedulesProps {
  matterData: Matter | null;
}

export default function TabSchedules({ matterData }: TabSchedulesProps) {
  const { user } = useUser();

  return (
    <>
      <Stack>
        <BasicCard
          title="Schedules"
          actionButton={
            user?.unsafeMetadata?.role !== "client" && (
              <Button
                leftSection={<IconCirclePlus size={18} />}
                size="xs"
                variant="outline"
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
