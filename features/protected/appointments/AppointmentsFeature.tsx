"use client";

import AppointmentsList from "@/components/appointments/AppointmentsList";
import AppointmentSummary from "@/components/appointments/AppointmentSummary";
import AppointmentsDatePicker from "@/components/appointments/DatePickerFilter";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { useDocument } from "@/hooks/useDocument";
import { Booking } from "@/types/booking";
import { GlobalSettings } from "@/types/global-settings";
import { useUser } from "@clerk/nextjs";
import { Button, Flex, Group, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCirclePlus, IconSettings } from "@tabler/icons-react";
import dayjs from "dayjs";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

const ymd = dayjs().format("YYYY-MM-DD");

export default function AppointmentsFeature() {
  const { user } = useUser();

  const {
    document: settings,
    // loading: loadingSettings,
    fetchData: fetchGlobalSettings,
  } = useDocument<GlobalSettings>({
    collectionName: COLLECTIONS.GLOBAL_SETTINGS,
    documentId: process.env.NEXT_PUBLIC_FIREBASE_SETTINGS_ID!,
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(ymd);
  const [currentDate, setCurrentDate] = useState<string>(ymd);

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
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setIsFetchingBookings(false);
      }
    );

    return () => unsub();
  }, [debounced, user]);

  return (
    <Flex w="100%" h="100%" gap={16} px={{ sm: 12, md: 0 }} direction="column">
      <Group align="flex-start">
        <AppointmentsDatePicker
          bookings={bookings}
          selectedDate={selectedDate}
          setCurrentDate={setCurrentDate}
          setSelectedDate={setSelectedDate}
        />

        <Stack flex={1}>
          {user?.unsafeMetadata?.role === "admin" && (
            <Group>
              <Button
                leftSection={<IconCirclePlus />}
                size="sm"
                variant="outline"
              >
                Add Appointment
              </Button>

              <Button
                leftSection={<IconSettings />}
                size="sm"
                variant="outline"
              >
                Settings
              </Button>
            </Group>
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
        isLoading={isFetchingBookings}
        selectedDate={selectedDate}
      />
    </Flex>
  );
}
