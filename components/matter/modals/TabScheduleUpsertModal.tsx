import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter, Schedule } from "@/types/case";
import {
  Button,
  Group,
  Modal,
  Paper,
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
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "react-toastify";
import { Booking } from "@/types/booking";
import axios from "axios";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { useUser } from "@clerk/nextjs";
import { MatterUpdateType } from "@/types/matter-updates";
import { appNotifications } from "@/utils/notifications/notifications";

interface TabScheduleUpsertModalProps {
  opened: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
  matterData: Matter;
}

export default function TabScheduleUpsertModal({
  opened,
  onClose,
  schedule,
  setDataChanged,
  matterData,
}: TabScheduleUpsertModalProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [attyBookings, setAttyBookings] = useState<Booking[]>([]);

  const isEdit = !!schedule;

  const form = useForm({
    initialValues: {
      title: "",
      date: new Date(),
      time: "",
      location: "",
      description: "",
    },
  });

  const fetchAttyBookings = async () => {
    const { docs } = await getDocs(
      query(
        collection(db, COLLECTIONS.BOOKINGS),
        where("attorney.id", "==", matterData.leadAttorney.id),
        where("date", "==", dayjs(form.values.date).format("YYYY-MM-DD"))
      )
    );
    setAttyBookings(
      docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking)
    );
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (isEdit) return;
    setIsLoading(true);
    const day = dayjs(values.date).format("YYYY-MM-DD");

    await axios
      .post("/api/google/calendar/add", {
        title: values.title,
        description: values.description,
        startISO: dayjs(`${day} ${values.time}`).toISOString(),
        endISO: dayjs(`${day} ${values.time}`).toISOString(),
        attendeesEmail: [
          matterData.leadAttorney.email,
          matterData.clientData.email,
        ],
        location: values.location,
      })
      .then(async ({ data: googleCalendar }) => {
        await setDoc(
          doc(db, COLLECTIONS.CASES, matterData.id),
          {
            schedules: arrayUnion({
              ...values,
              date: dayjs(values.date).format("YYYY-MM-DD"),
              scheduleId: nanoid(10),
              createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              googleCalendar,
            }),
          },
          { merge: true }
        )
          .then(async () => {
            await addMatterUpdate(
              user!,
              matterData.id,
              user?.unsafeMetadata.role as string,
              MatterUpdateType.SCHEDULE,
              `Schedule Added: ${values.title}`
            );
            setDataChanged((prev) => !prev);
            appNotifications.success({
              title: "Schedule added successfully",
              message: "The schedule has been added successfully",
            });
            onClose();
          })
          .catch(() =>
            appNotifications.error({
              title: "Failed to add schedule",
              message: "The schedule could not be added. Please try again.",
            })
          )
          .finally(() => setIsLoading(false));
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to add schedule",
          message: "The schedule could not be added. Please try again.",
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (form.values.date) fetchAttyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.date]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit Schedule" : "Add Schedule"}
      centered
      size="lg"
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isLoading}
    >
      {attyBookings && attyBookings.length > 0 && (
        <Paper mt="md" withBorder radius="md" p="md" bg="blue.0">
          <Text size="sm" fw={600} mb="sm">
            Attorney&apos;s Booked Times with this date
          </Text>
          <TableScrollContainer mah={400} minWidth={200}>
            <Table withTableBorder style={{ borderRadius: 8 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Client</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {attyBookings.map((booking, i) => (
                  <Table.Tr key={i}>
                    <Table.Td fw={600}>
                      <TimeValue value={booking.time} format="12h" />
                    </Table.Td>
                    <Table.Td fw={600}>{booking.client.fullname}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </TableScrollContainer>
        </Paper>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group grow>
            <DatePickerInput
              withAsterisk
              label="Date"
              placeholder="Select Date"
              clearable
              hideOutsideDates
              {...form.getInputProps("date")}
            />

            <TimePicker
              withAsterisk
              label="Time"
              {...form.getInputProps("time")}
            />
          </Group>

          <Group grow>
            <TextInput
              withAsterisk
              label="Title"
              placeholder="Enter title"
              {...form.getInputProps("title")}
            />

            <TextInput
              withAsterisk
              label="Location"
              placeholder="Enter location"
              {...form.getInputProps("location")}
            />
          </Group>

          <Textarea
            withAsterisk
            label="Description"
            placeholder="Enter description"
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("description")}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                !form.values.date ||
                !form.values.time ||
                !form.values.title ||
                !form.values.location ||
                !form.values.description
              }
              loading={isLoading}
            >
              {isEdit ? "Update Schedule" : "Add Schedule"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
