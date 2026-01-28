"use client";

import logo from "@/public/images/logo.png";
import BookingModal from "@/components/booking/BookingModal";
import { useUser } from "@clerk/nextjs";
import {
  Alert,
  Box,
  Button,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  NavLink,
  Text,
  Tooltip,
} from "@mantine/core";
import { DatePicker, getTimeRange, TimeGrid } from "@mantine/dates";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconHome, IconInfoCircle, IconRocket } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/components/Appshell.module.css";
import classes from "./Booking.module.css";

import {
  collection,
  getDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { Booking } from "@/types/booking";
import { CLERK_ORG_IDS, COLLECTIONS } from "@/constants/constants";
import dayjs from "dayjs";
import { SPECIAL_HOLIDAYS } from "@/constants/constants";
import { REGULAR_HOLIDAYS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import axios from "axios";
import { WORK_SCHEDULE } from "@/constants/non-working-sched";

export default function BookingPage() {
  const { user, isLoaded } = useUser();

  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const [isFetchingGlobalSched, setIsFetchingGlobalSched] = useState(false);

  const [attorneyCount, setAttorneyCount] = useState(0);
  const [isFetchingAttorneyCount, setIsFetchingAttorneyCount] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [validHolidays, setValidHolidays] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>(
    {},
  );

  const [isSuccess, setIsSuccess] = useState(false);

  const [currentDate, setCurrentDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  const [debounced] = useDebouncedValue(currentDate, 500);

  const [
    isBookingModalOpen,
    { open: openBookingModal, close: closeBookingModal },
  ] = useDisclosure();

  const fetchGlobalSched = async () => {
    setIsFetchingGlobalSched(true);
    try {
      const snap = await getDoc(
        doc(
          db,
          COLLECTIONS.GLOBAL_SCHED,
          process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
        ),
      );
      if (!snap.exists()) return;

      const d = snap.data();

      const getValidKeys = (o: Record<string, boolean>) =>
        Object.keys(o).filter((key) => o[key]);

      const validHolidayIds = [
        ...getValidKeys(d.regularHolidays),
        ...getValidKeys(d.specialHolidays),
      ];

      const holidayMap = Object.fromEntries([
        ...REGULAR_HOLIDAYS.map((h) => [h.id, h.date]),
        ...SPECIAL_HOLIDAYS.map((h) => [h.id, h.date]),
      ]);

      const timeHours = getTimeRange({
        startTime: d.officeHours.officeStart,
        endTime: d.officeHours.officeEnd,
        interval: d.officeHours.bookingInterval,
      });

      const workDays = Object.keys(d.workSchedule)
        .filter((key) => d.workSchedule[key])
        .map((key) => WORK_SCHEDULE.find((w) => w.name === key)?.value);

      const blockedDatesMap = d?.blockedDates;

      setValidHolidays(
        validHolidayIds.map((id) => holidayMap[id]).filter(Boolean),
      );
      setWorkDays(workDays as number[]);
      setTimeSlots(timeHours);
      setBlockedDates(blockedDatesMap);
    } finally {
      setIsFetchingGlobalSched(false);
    }
  };

  const fetchAttorneyCount = async (searchTerm: string) => {
    setIsFetchingAttorneyCount(true);

    try {
      const { data } = await axios.get("/api/clerk/fetch-total-count", {
        params: {
          organization_id: CLERK_ORG_IDS.attorney,
          search: searchTerm.trim(),
        },
      });

      setAttorneyCount(data?.total_count);
    } finally {
      setIsFetchingAttorneyCount(false);
    }
  };

  const successCallback = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setIsSuccess(true);
    setCurrentDate(dayjs().format("YYYY-MM-DD"));
  };

  useEffect(() => {
    if (!isLoaded) return;

    fetchGlobalSched();
    fetchAttorneyCount("");
  }, [isLoaded]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  useEffect(() => {
    const startOfMonth = dayjs(debounced).startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs(debounced).endOf("month").format("YYYY-MM-DD");

    const ref = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(
      ref,
      where("date", ">=", startOfMonth),
      where("date", "<=", endOfMonth),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results: Booking[] = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Booking[];

        setBookings(results);
      },
      () => {
        appNotifications.error({
          title: "Failed to get bookings",
          message: "The bookings could not be fetched. Please try again.",
          autoClose: false,
        });
      },
    );

    return () => unsub();
  }, [debounced]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
  }, [currentDate]);

  return (
    <Container fluid p={0} bg="green.4" mih="100vh">
      <Flex
        pt={16}
        px={{ base: 16, xs: 16, sm: 0, md: 0, lg: 0 }}
        maw={700}
        w="100%"
        align="center"
        justify="space-between"
        mx="auto"
      >
        <NavLink
          active
          component={Link}
          key="Back to Home"
          href={!!user ? "/appointments" : "/sign-in"}
          className={styles.appShellRoot}
          styles={{
            label: {
              color: "white",
              fontWeight: 700,
              letterSpacing: 1.5,
            },
            root: {
              borderRadius: 6,
              backgroundColor: "transparent",
              border: "1px solid rgba(117, 161, 150, 0.5)",
            },
          }}
          leftSection={<IconHome color="white" size={20} />}
          w={45}
        />
      </Flex>

      <Flex justify="center" align="center" mih="calc(100vh - 100px)">
        {isSuccess ? (
          <Alert
            title="Your booking is secured"
            color="green"
            icon={<IconRocket />}
            mb="xl"
            maw={500}
            styles={(theme) => ({
              title: { fontWeight: 700, color: theme.colors.green[4] },
              icon: { color: theme.colors.green[4] },
              message: {
                color: theme.colors.green[4],
                textAlign: "justify",
                paddingRight: 16,
              },
              root: {
                backgroundColor: theme.colors.green[0],
                boxShadow: theme.other.customBoxShadow,
                borderRadius: 10,
              },
            })}
          >
            Thank you for scheduling with us — we&apos;re excited to talk to
            you! Your appointment is submitted, you will receive an email
            confirmation once it&apos;s confirmed.
            <br />
            <br />
            You can view all your bookings and their details anytime through
            your appointments dashboard. If you don&apos;t have an account, you
            can create one by clicking this <Link href={`/sign-in}`}>link</Link>
            . Just make sure to use the same email address you used to book the
            appointment.
            <Group mt={16} justify="end">
              <Button
                variant="filled"
                color="green"
                size="xs"
                onClick={() => setIsSuccess(false)}
              >
                Book Again
              </Button>
            </Group>
          </Alert>
        ) : (
          <Box
            w="100%"
            maw={700}
            bg="white"
            style={(theme) => ({
              boxShadow: theme.other.customBoxShadow,
              borderRadius: 10,
            })}
            p={16}
            m={16}
            pos="relative"
          >
            <LoadingOverlay
              visible={
                isFetchingGlobalSched || isFetchingAttorneyCount || !isLoaded
              }
            />
            <Image
              src={logo}
              alt="logo"
              width={100}
              height={100}
              style={{ display: "block", marginInline: "auto" }}
            />

            <Flex
              align="center"
              justify="center"
              mb={16}
              gap={{ base: 0, xs: 8 }}
              direction={{
                base: "column-reverse",
                xs: "row",
              }}
            >
              <Text ta="center" fw={700} fz={24} c="#2B4E45">
                Book an appointment
              </Text>
              <Tooltip
                bg="transparent"
                multiline
                w={220}
                transitionProps={{ duration: 200 }}
                events={{ hover: true, focus: true, touch: true }}
                label={
                  <Alert
                    variant="filled"
                    color="#2B4E45"
                    title="Office Hours and Booking Rules"
                    styles={(theme) => ({
                      title: { textAlign: "center", fontSize: 14 },
                      body: { textAlign: "center" },
                      root: {
                        backgroundColor: theme.colors.green[6],
                        boxShadow: theme.other.customBoxShadow,
                        borderRadius: 10,
                      },
                    })}
                  >
                    <Text size="xs">
                      Our office hours are Monday through Friday, from 8:00 AM
                      to 5:00 PM. Appointments must be booked at least 24 hours
                      in advance.
                    </Text>
                  </Alert>
                }
              >
                <IconInfoCircle style={{ cursor: "pointer" }} color="#2B4E45" />
              </Tooltip>
            </Flex>

            <Flex
              h="100%"
              px={16}
              gap={16}
              align="center"
              direction={{
                base: "column",
                xs: "row",
                sm: "row",
                md: "row",
                lg: "row",
                xl: "row",
              }}
            >
              <Flex flex={1} justify="center">
                <DatePicker
                  hideOutsideDates
                  onDateChange={(date) =>
                    setCurrentDate(dayjs(date).format("YYYY-MM-DD"))
                  }
                  excludeDate={(date) => {
                    const truncatedDate = dayjs(date).format("MM/DD");

                    // if holiday, return true
                    if (validHolidays.includes(truncatedDate)) return true;

                    // if it's not a work day, return true
                    if (!workDays.includes(dayjs(date).day())) return true;

                    return false;
                  }}
                  minDate={dayjs().add(1, "day").toDate()}
                  allowDeselect
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </Flex>

              <Flex flex={1} justify="center">
                <TimeGrid
                  classNames={{
                    control: selectedDate ? classes.control : undefined,
                  }}
                  value={selectedTime}
                  onChange={setSelectedTime}
                  disabled={!selectedDate}
                  data={timeSlots}
                  disableTime={(time) => {
                    const timeSlot = dayjs(`${selectedDate} ${time}`);
                    const selectedDateBookings = bookings.filter(
                      (booking) =>
                        booking.date === selectedDate && booking.time === time,
                    );

                    // 1 day before is before 5PM, return true
                    if (timeSlot.isBefore(dayjs().add(1, "day"))) return true;

                    // if time is in blocked dates
                    if (
                      selectedDate &&
                      blockedDates?.[selectedDate]?.includes(time)
                    )
                      return true;

                    if (selectedDateBookings.length >= attorneyCount)
                      return true;

                    return false;
                  }}
                  allowDeselect
                  format="12h"
                />
              </Flex>
            </Flex>

            <Button
              mx="auto"
              mt={24}
              radius="sm"
              display="block"
              w={{ base: "200px", xs: "100%" }}
              onClick={openBookingModal}
              disabled={!selectedDate || !selectedTime}
            >
              Book Now
            </Button>
          </Box>
        )}
      </Flex>

      <BookingModal
        opened={isBookingModalOpen}
        onClose={closeBookingModal}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        user={user ?? null}
        successCallback={successCallback}
        attorneyCount={attorneyCount || 0}
      />
    </Container>
  );
}
