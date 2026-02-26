import { useEffect, useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Divider,
  em,
  Group,
  Modal,
  NumberInput,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  Tabs,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput, getTimeRange, TimeValue } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import axios from "axios";
import dayjs from "dayjs";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  ATTY_PRACTICE_AREAS,
  CLERK_ORG_IDS,
  COLLECTIONS,
} from "@/constants/constants";
import { db } from "@/firebase/config";
import { Booking } from "@/types/booking";
import { GlobalSched } from "@/types/global-sched";
import { Attorney, Client } from "@/types/user";
import { appNotifications } from "@/utils/notifications/notifications";

type AddAppointmentModalProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  globalSched: GlobalSched | null;
};

export default function AddAppointmentModal({
  opened,
  onClose,
  booking,
  globalSched,
}: AddAppointmentModalProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const theme = useMantineTheme();

  const [times, setTimes] = useState<{ label: string; value: string }[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [hasFetchedAtty, setHasFetchedAtty] = useState(false);
  const [hasFetchedClient, setHasFetchedClient] = useState(false);

  const [clientUsers, setClientUsers] = useState<Client[]>([]);
  const [attorneyUsers, setAttorneyUsers] = useState<Attorney[]>([]);

  const [attyBookings, setAttyBookings] = useState<Booking[]>([]);

  const [selectedClientType, setSelectedClientType] = useState<
    "Existing Client" | "New Client"
  >("Existing Client");

  const handleFetchAtty = async () => {
    const { data } = await axios.get<Attorney[]>(
      "/api/clerk/organization/fetch",
      {
        params: {
          organization_id: CLERK_ORG_IDS.attorney,
          limit: 9999,
        },
      },
    );
    setAttorneyUsers(data);
    setHasFetchedAtty(true);
  };

  const handleFetchClient = async () => {
    const { data } = await axios.get<Client[]>(
      "/api/clerk/organization/fetch",
      {
        params: {
          organization_id: CLERK_ORG_IDS.client,
          limit: 9999,
        },
      },
    );
    setClientUsers(data);
    setHasFetchedClient(true);
  };

  const fetchAttyBookings = async () => {
    const { docs } = await getDocs(
      query(
        collection(db, COLLECTIONS.BOOKINGS),
        where("attorney.id", "==", form.values.attorney),
        where("date", "==", dayjs(form.values.date).format("YYYY-MM-DD")),
      ),
    );
    setAttyBookings(
      docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking),
    );
  };

  const form = useForm({
    initialValues: {
      client: "",
      attorney: "",
      date: new Date(),
      time: "",
      message: "",
      isPaid: true,
      via: "Walk-in",
      areas: [] as string[],
      consultationMode: "in-person",
      branch: "",
      representedByPreviousLawyer: false,
    },
  });

  const clientForm = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      fullAddress: "",
      birthday: null as Date | null,
    },
    validate: {
      firstName: (value) => (!value.length ? "First name is required" : null),
      lastName: (value) => (!value.length ? "Last name is required" : null),
      email: (value) =>
        !value?.length
          ? "Email is required"
          : /^\S+@\S+$/.test(value)
            ? null
            : "Invalid Email",
      phoneNumber: (value) =>
        String(value).length < 10 ? "Invalid Phone Number" : null,
    },
    validateInputOnChange: true,
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);

    let clientData;

    const attyDetails = attorneyUsers.find(
      (attorney) => attorney.id === values.attorney,
    );

    if (selectedClientType === "Existing Client") {
      const clientDetails = clientUsers.find(
        (client) => client.id === values.client,
      );
      clientData = {
        fullname: clientDetails?.first_name + " " + clientDetails?.last_name,
        id: clientDetails?.id,
        email: clientDetails?.email_addresses[0].email_address,
        firstName: clientDetails?.first_name,
        lastName: clientDetails?.last_name,
        phoneNumber: clientDetails?.unsafe_metadata?.phoneNumber,
        fullAddress: clientDetails?.unsafe_metadata?.fullAddress || "",
        birthday: clientDetails?.unsafe_metadata?.birthday || "",
      };
    } else {
      clientData = {
        firstName: clientForm.values.firstName,
        lastName: clientForm.values.lastName,
        fullname:
          clientForm.values.firstName + " " + clientForm.values.lastName,
        email: clientForm.values.email,
        phoneNumber: clientForm.values.phoneNumber || "",
        fullAddress: clientForm.values.fullAddress || "",
        birthday: clientForm.values.birthday
          ? dayjs(clientForm.values.birthday).format("YYYY-MM-DD")
          : undefined,
      };
    }

    const startISO = dayjs(
      `${dayjs(values.date).format("YYYY-MM-DD")} ${values.time}`,
    );
    const endISO = startISO.add(1, "hour");

    const firebaseAddBooking = async ({
      eventId,
      htmlLink,
    }: {
      eventId: string;
      htmlLink: string;
    }) => {
      await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
        ...values,
        existingClient: selectedClientType === "Existing Client",
        date: dayjs(values.date).format("YYYY-MM-DD"),
        attorney: {
          fullname: attyDetails?.first_name + " " + attyDetails?.last_name,
          id: attyDetails?.id,
          email: attyDetails?.email_addresses[0].email_address,
        },
        client: clientData,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        googleCalendar: {
          eventId,
          htmlLink,
        },
        consultationMode: values.consultationMode,
        branch: values.consultationMode === "in-person" ? values.branch : "",
      })
        .then(() => {
          appNotifications.success({
            title: "Appointment added successfully",
            message: "The appointment has been added successfully",
          });

          onClose();
        })
        .catch(() =>
          appNotifications.error({
            title: "Failed to add appointment",
            message: "The appointment could not be added. Please try again.",
          }),
        )
        .finally(() => setIsLoading(false));
    };

    const firebaseUpdateBooking = async ({
      eventId,
      htmlLink,
    }: {
      eventId: string;
      htmlLink: string;
    }) => {
      await updateDoc(doc(db, COLLECTIONS.BOOKINGS, booking!.id), {
        ...values,
        existingClient: selectedClientType === "Existing Client",
        date: dayjs(values.date).format("YYYY-MM-DD"),
        attorney: {
          fullname: attyDetails?.first_name + " " + attyDetails?.last_name,
          id: attyDetails?.id,
          email: attyDetails?.email_addresses[0].email_address,
        },
        client: clientData,
        googleCalendar: {
          eventId,
          htmlLink,
        },
        consultationMode: values.consultationMode,
        branch: values.consultationMode === "in-person" ? values.branch : "",
      })
        .then(() => {
          appNotifications.success({
            title: "Appointment updated successfully",
            message: "The appointment has been updated successfully",
          });
          onClose();
        })
        .catch(() =>
          appNotifications.error({
            title: "Failed to update appointment",
            message: "The appointment could not be updated. Please try again.",
          }),
        )
        .finally(() => setIsLoading(false));
    };

    if (booking?.googleCalendar?.eventId) {
      await axios
        .post("/api/google/calendar/update", {
          title: "Appointment from BaisAndan Law Office",
          startISO: startISO.toISOString(),
          endISO: endISO.toISOString(),
          attendeesEmail: [
            attyDetails?.email_addresses[0].email_address,
            clientData.email,
          ],
          eventId: booking.googleCalendar.eventId,
        })
        .then(async ({ data }) => {
          await firebaseUpdateBooking({
            eventId: data.eventId,
            htmlLink: data.htmlLink,
          });
        })
        .catch(() => {
          appNotifications.error({
            title: "Failed to update appointment",
            message: "The appointment could not be updated. Please try again.",
          });
          setIsLoading(false);
        });

      return;
    }

    await axios
      .post("/api/google/calendar/add", {
        title: "Appointment from BaisAndan Law Office",
        startISO: startISO.toISOString(),
        endISO: endISO.toISOString(),
        attendeesEmail: [
          attyDetails?.email_addresses[0].email_address,
          clientData.email,
        ],
      })
      .then(async ({ data: googleCalendarData }) => {
        if (booking) {
          await firebaseUpdateBooking({
            eventId: googleCalendarData.eventId,
            htmlLink: googleCalendarData.htmlLink,
          });
        } else {
          await firebaseAddBooking({
            eventId: googleCalendarData.eventId,
            htmlLink: googleCalendarData.htmlLink,
          });
        }
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to add appointment",
          message: "The appointment could not be added. Please try again.",
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (hasFetchedAtty && hasFetchedClient) return;
    handleFetchAtty();
    handleFetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      form.reset();
      clientForm.reset();
      setAttyBookings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (booking && opened) {
      form.setValues({
        attorney: booking.attorney?.id || "",
        date: new Date(booking.date),
        time: dayjs(`2000-01-01 ${booking.time}`).format("HH:mm"),
        message: booking.message,
        via: booking.via,
        areas: booking.areas || [],
        consultationMode: booking?.consultationMode || "in-person",
        branch: booking?.branch || "",
        representedByPreviousLawyer:
          booking?.representedByPreviousLawyer || false,
      });

      if (booking.existingClient) {
        setSelectedClientType("Existing Client");
        form.setFieldValue("client", booking.client.id);
      } else {
        setSelectedClientType("New Client");
        form.setFieldValue("client", "");
        clientForm.setValues({
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          email: booking.client.email,
          phoneNumber: booking.client.phoneNumber,
          fullAddress: booking.client.fullAddress || "",
          birthday: booking.client.birthday
            ? new Date(booking.client.birthday)
            : null,
        });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, times]);

  useEffect(() => {
    if (form.values.attorney && form.values.date) fetchAttyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.attorney, form.values.date]);

  useEffect(() => {
    if (opened && globalSched && globalSched?.officeHours) {
      const { officeHours } = globalSched;

      const timeHours = getTimeRange({
        startTime: officeHours.officeStart,
        endTime: officeHours.officeEnd,
        interval: officeHours.bookingInterval,
      });

      setTimes(
        timeHours.map((t) => {
          const hhmm = t.slice(0, 5);
          const d = dayjs(`2000-01-01 ${hhmm}`);
          return {
            value: hhmm,
            label: d.format("h:mm A"),
          };
        }),
      );
    }
  }, [opened, globalSched]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={booking ? "Update Appointment" : "Add Appointment"}
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">
          <Stack gap="0">
            <Divider label="Attorney" color="blue" />
            <Select
              withAsterisk
              searchable
              label="Attorney"
              placeholder="Select Attorney"
              data={attorneyUsers.map((user) => ({
                value: user.id,
                label: `${user.first_name} ${user.last_name}`,
              }))}
              renderOption={({ option }) => {
                const selectedAttorney = attorneyUsers.find(
                  (attorney) => attorney.id === option.value,
                );
                const practiceAreas =
                  selectedAttorney?.unsafe_metadata.practiceAreas || [];

                return (
                  <div>
                    <div>{option.label}</div>
                    <div
                      style={{
                        marginTop: 4,
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      {practiceAreas.map((area: string, index: number) => (
                        <Badge
                          key={index}
                          size="xs"
                          variant="outline"
                          radius="xs"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }}
              nothingFoundMessage="No attorneys found"
              {...form.getInputProps("attorney")}
            />

            {form.values.date &&
              form.values.attorney &&
              attyBookings?.filter((b) => b.id !== booking?.id)?.length > 0 && (
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
                        {attyBookings
                          .filter((b) => b.id !== booking?.id)
                          .map((booking, i) => (
                            <Table.Tr key={i}>
                              <Table.Td fw={600}>
                                <TimeValue value={booking.time} format="12h" />
                              </Table.Td>
                              <Table.Td fw={600}>
                                {booking.client.fullname}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </TableScrollContainer>
                </Paper>
              )}
          </Stack>

          <Stack gap="xs">
            <Divider label="Client" color="blue" />
            <Tabs
              value={selectedClientType}
              onChange={(value) =>
                setSelectedClientType(value as "Existing Client" | "New Client")
              }
              variant="outline"
            >
              <Tabs.List>
                <Tabs.Tab value="Existing Client" flex={1}>
                  Existing Client
                </Tabs.Tab>
                <Tabs.Tab value="New Client" flex={1}>
                  New Client
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            {selectedClientType === "Existing Client" && (
              <Select
                withAsterisk
                searchable
                label="Client"
                placeholder="Select Client"
                data={clientUsers.map((user) => ({
                  value: user.id,
                  label: `${user.first_name} ${user.last_name} (${user.email_addresses[0].email_address})`,
                }))}
                nothingFoundMessage="No clients found"
                {...form.getInputProps("client")}
              />
            )}

            {selectedClientType === "New Client" && (
              <SimpleGrid
                cols={isMobile ? 1 : 2}
                verticalSpacing={isMobile ? "2px" : "md"}
              >
                <TextInput
                  withAsterisk
                  label="First Name"
                  placeholder="Enter First Name"
                  {...clientForm.getInputProps("firstName")}
                />

                <TextInput
                  withAsterisk
                  label="Last Name"
                  placeholder="Enter Last Name"
                  {...clientForm.getInputProps("lastName")}
                />

                <TextInput
                  withAsterisk
                  label="Email"
                  placeholder="Enter Email"
                  {...clientForm.getInputProps("email")}
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
                  {...clientForm.getInputProps("phoneNumber")}
                />
                <TextInput
                  label="Full Address"
                  placeholder="Enter Full Address"
                  {...clientForm.getInputProps("fullAddress")}
                />
                <DatePickerInput
                  label="Birthday"
                  placeholder="Select Birthday"
                  clearable
                  valueFormat="YYYY-MM-DD"
                  {...clientForm.getInputProps("birthday")}
                />
              </SimpleGrid>
            )}
          </Stack>

          <Stack gap="xs">
            <Divider label="Date & Time" color="blue" />
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
                {...form.getInputProps("date")}
              />

              <Select
                withAsterisk
                label="Time"
                placeholder="Select Time"
                data={times?.map((time) => ({
                  value: time.value,
                  label: time.label,
                  disabled: attyBookings.some(
                    (b) => b.time === time.value && b.id !== booking?.id,
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
            <Divider label="Other Details" color="blue" />

            <Select
              withAsterisk
              label="Via"
              clearable={false}
              placeholder="Select Via"
              {...form.getInputProps("via")}
              data={[
                "Website",
                "Phone Call",
                "Email",
                "Walk-in",
                "Facebook",
                "Referral",
                "Others",
              ]}
            />

            <TagsInput
              withAsterisk
              label="Areas"
              placeholder="Select Areas"
              data={ATTY_PRACTICE_AREAS}
              clearable
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: {
                  transition: "pop-top-left",
                  duration: 200,
                },
              }}
              styles={{
                pill: {
                  backgroundColor: theme.colors.green[0],
                  color: theme.colors.green[9],
                },
              }}
              {...form.getInputProps("areas")}
            />

            <Textarea
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
              loading={isLoading}
              disabled={
                !form.values.attorney ||
                !form.values.date ||
                !form.values.time ||
                !form.values.message ||
                !form.values.via ||
                !form.values.areas.length ||
                (form.values.consultationMode === "in-person" &&
                  !form.values.branch) ||
                (selectedClientType === "Existing Client" &&
                  !form.values.client) ||
                (selectedClientType === "New Client" && !clientForm.isValid())
              }
            >
              {booking ? "Update Appointment" : "Add Appointment"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
