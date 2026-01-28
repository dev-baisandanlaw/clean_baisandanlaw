"use client";

import AppointmentsList from "@/components/appointments/AppointmentsList";
import AppointmentSummary from "@/components/appointments/AppointmentSummary";
import AppointmentsDatePicker from "@/components/appointments/DatePickerFilter";
import UpsertAppointmentModal from "@/components/appointments/modals/UpsertAppointmentModal";
import DeleteDuplicateModal from "@/components/appointments/modals/DeleteDuplicateModal";
import ViewAppointmentModal from "@/components/appointments/modals/ViewAppointmentModal";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Booking } from "@/types/booking";
import { useUser } from "@clerk/nextjs";
import {
  Alert,
  Badge,
  Button,
  em,
  Flex,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconFlame, IconSettings } from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SettingsModal from "@/components/appointments/modals/SettingsModal";
import { GlobalSched } from "@/types/global-sched";
import { appNotifications } from "@/utils/notifications/notifications";
import { useRouter } from "nextjs-toploader/app";

const ymd = dayjs().format("YYYY-MM-DD");

export default function AppointmentsFeature() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [dataChanged, setDataChanged] = useState(false);
  const [globalSched, setGlobalSched] = useState<GlobalSched | null>(null);
  const [isFetchingGlobalSched, setIsFetchingGlobalSched] = useState(false);

  const fetchGlobalSched = async () => {
    try {
      setIsFetchingGlobalSched(true);
      const snap = await getDoc(
        doc(
          db,
          COLLECTIONS.GLOBAL_SCHED,
          process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
        ),
      );
      if (!snap.exists()) return;

      setGlobalSched({ ...snap.data() } as GlobalSched);
    } catch {
      appNotifications.error({
        title: "Failed to fetch global sched",
        message: "The global sched could not be fetched. Please try again.",
      });
    } finally {
      setIsFetchingGlobalSched(false);
    }
  };

  useEffect(() => {
    if (!user || !isLoaded) return;

    fetchGlobalSched();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataChanged, isLoaded]);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [noAttorneyBookings, setNoAttorneyBookings] = useState<Booking[]>();
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(ymd);
  const [currentDate, setCurrentDate] = useState<string>(ymd);

  const [appModal, { open: openAppModal, close: closeAppModal }] =
    useDisclosure(false);
  const [delModal, { open: openDelModal, close: closeDelModal }] =
    useDisclosure(false);
  const [viewModal, { open: openViewModal, close: closeViewModal }] =
    useDisclosure(false);
  const [
    settingsModalOpened,
    { open: openSettingsModal, close: closeSettingsModal },
  ] = useDisclosure(false);

  const handleSelectBooking = (
    booking: Booking | null,
    mode: "update" | "delete" | "view" | "add",
  ) => {
    setSelectedBooking(booking);

    if (mode === "delete") {
      openDelModal();
    }

    if (mode === "view") {
      openViewModal();
    }

    if (mode === "add") {
      openAppModal();
    }

    if (mode === "update") {
      openAppModal();
    }
  };

  const fetchNoAttorneyBookings = async () => {
    const ref = collection(db, COLLECTIONS.BOOKINGS);
    const constraints = [where("attorney", "==", null)];
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
    );
    setNoAttorneyBookings(bookings);
  };

  const [debounced] = useDebouncedValue(currentDate, 150);

  useEffect(() => {
    if (!user) return;

    setIsFetchingBookings(true);

    const startOfMonth = dayjs(debounced).startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs(debounced).endOf("month").format("YYYY-MM-DD");

    const ref = collection(db, COLLECTIONS.BOOKINGS);
    const constraints = [
      where("date", ">=", startOfMonth),
      where("date", "<=", endOfMonth),
    ];

    if (user?.unsafeMetadata?.role === "client") {
      constraints.push(where("client.id", "==", user?.id));
    } else if (user?.unsafeMetadata?.role === "attorney") {
      constraints.push(where("attorney.id", "==", user?.id)); // TODO: Automate attorney assignment when booking is created
    }

    const q = query(ref, ...constraints);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results: Booking[] = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Booking[];

        setBookings(results);
        setIsFetchingBookings(false);
        fetchNoAttorneyBookings(); // Fetch no attorney bookings
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setIsFetchingBookings(false);
      },
    );

    return () => unsub();
  }, [debounced, user]);

  return (
    <>
      {user?.unsafeMetadata?.role === "admin" &&
        noAttorneyBookings &&
        noAttorneyBookings?.length > 0 && (
          <Alert
            title="Alert!"
            color="red"
            icon={<IconFlame />}
            mb="xl"
            styles={(theme) => ({
              title: { fontWeight: 700, color: theme.colors.red[4] },
              icon: { color: theme.colors.red[4] },
              message: {
                color: theme.colors.red[4],
                textAlign: "justify",
                paddingRight: 16,
              },
              root: {
                backgroundColor: theme.colors.red[0],
                boxShadow: theme.other.customBoxShadow,
                borderRadius: 10,
              },
            })}
          >
            <Text mb="xs" size="sm">
              There are bookings with no attorney assigned.
            </Text>

            <Group gap="xs">
              {noAttorneyBookings
                ?.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
                .map((booking) => (
                  <Badge
                    key={booking.id}
                    variant="outline"
                    color="red"
                    radius="xs"
                  >
                    {getDateFormatDisplay(
                      `${booking.date} ${booking.time}`,
                      true,
                    )}
                  </Badge>
                ))}
            </Group>
          </Alert>
        )}
      <Flex
        w="100%"
        h="100%"
        gap={16}
        px={{ sm: 12, md: 0 }}
        direction="column"
      >
        <Group align="center" justify="center">
          <AppointmentsDatePicker
            bookings={bookings}
            selectedDate={selectedDate}
            setCurrentDate={setCurrentDate}
            setSelectedDate={setSelectedDate}
          />

          <Stack flex={1}>
            {user?.unsafeMetadata?.role === "admin" && (
              <Group
                justify="space-between"
                {...(isMobile ? { grow: true } : {})}
              >
                <Button
                  leftSection={<IconCirclePlus />}
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectBooking(null, "add")}
                >
                  Add Appointment
                </Button>

                <Button
                  leftSection={<IconSettings />}
                  size="sm"
                  loading={isFetchingGlobalSched}
                  variant="outline"
                  onClick={openSettingsModal}
                >
                  Settings
                </Button>
              </Group>
            )}

            {user?.unsafeMetadata?.role === "client" && (
              <Button
                leftSection={<IconCirclePlus />}
                size="sm"
                onClick={() => router.push("/booking")}
              >
                Book Appointment
              </Button>
            )}

            <AppointmentSummary
              bookings={bookings}
              currentDate={currentDate}
              selectedDate={selectedDate}
            />
          </Stack>
        </Group>

        <AppointmentsList
          data={bookings || []}
          isLoading={appModal ? false : isFetchingBookings}
          selectedDate={selectedDate}
          handleSelectBooking={handleSelectBooking}
        />
      </Flex>

      <UpsertAppointmentModal
        opened={appModal}
        onClose={closeAppModal}
        booking={selectedBooking || null}
        globalSched={globalSched}
      />

      <DeleteDuplicateModal
        opened={delModal}
        onClose={closeDelModal}
        booking={selectedBooking || null}
      />

      <ViewAppointmentModal
        opened={viewModal}
        onClose={closeViewModal}
        booking={selectedBooking || null}
      />

      <SettingsModal
        opened={settingsModalOpened}
        onClose={closeSettingsModal}
        globalSched={globalSched}
        setDataChanged={setDataChanged}
      />
    </>
  );
}
