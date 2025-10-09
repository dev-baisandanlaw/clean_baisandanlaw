import { Matter, Schedule } from "@/types/case";
import { useUser } from "@clerk/nextjs";
import { Button, Card, Group, Stack, Table, Text } from "@mantine/core";
import {
  IconBuildingBank,
  IconCirclePlus,
  IconLabel,
  IconNotes,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import EmptyTableComponent from "../EmptyTableComponent";
import TabScheduleUpsertModal from "./modals/TabScheduleUpsertModal";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { TimeValue } from "@mantine/dates";

interface TabSchedulesProps {
  matterData: Matter;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabSchedules({
  matterData,
  setDataChanged,
}: TabSchedulesProps) {
  const { user } = useUser();

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

  const [schedModal, { open: openSchedModal, close: closeSchedModal }] =
    useDisclosure(false);

  const handleSelectSchedule = (schedule: Schedule | null) => {
    setSelectedSchedule(schedule);
    openSchedModal();
  };

  return (
    <>
      <Card withBorder radius="md" p="md" pos="relative">
        <Card.Section inheritPadding py="xs">
          <Group justify="space-between">
            <Text size="lg" fw={600} c="green">
              All Schedules
            </Text>

            {user?.unsafeMetadata?.role !== "client" && (
              <Button
                leftSection={<IconCirclePlus />}
                size="sm"
                variant="outline"
                onClick={() => handleSelectSchedule(null)}
              >
                Add Schedule
              </Button>
            )}
          </Group>
        </Card.Section>

        <Stack>
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

      <TabScheduleUpsertModal
        opened={schedModal}
        onClose={closeSchedModal}
        schedule={selectedSchedule}
        setDataChanged={setDataChanged}
        matterData={matterData}
      />
    </>
  );
}

const ScheduleDetailsCard = ({ schedule }: { schedule: Schedule }) => {
  return (
    <Card
      withBorder
      radius="md"
      p="xs"
      w="100%"
      style={{
        borderLeft: "3px solid green",
      }}
    >
      <Card.Section inheritPadding py="xs">
        <Group wrap="nowrap">
          <Stack
            h="100%"
            style={{ borderRight: "1px solid #e0e0e0" }}
            pr="md"
            gap={0}
            align="center"
            justify="stretch"
          >
            <Text c="green">{dayjs(schedule.date).format("MMMM")}</Text>
            <Text fw={700} c="green" size="xl">
              {dayjs(schedule.date).format("D")}
            </Text>
            <Text c="green">{dayjs(schedule.date).format("dddd")}</Text>
          </Stack>

          <Table variant="vertical" layout="fixed">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td w={40}>
                  <IconLabel size={18} color="green" />
                </Table.Td>
                <Table.Td>{schedule.title}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td w={40}>
                  <IconNotes size={18} color="green" />
                </Table.Td>
                <Table.Td>{schedule.description}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td w={40}>
                  <IconBuildingBank size={18} color="green" />
                </Table.Td>
                <Table.Td>
                  {schedule.location} |{" "}
                  <TimeValue value={schedule.time} format="12h" />
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Group>
      </Card.Section>
    </Card>
  );
};
