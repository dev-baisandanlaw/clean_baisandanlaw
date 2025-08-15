"use client";

import logo from "@/public/images/logo.png";
import BookingModal from "@/components/booking/BookingModal";
import { UserButton, useUser } from "@clerk/nextjs";
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

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Booking } from "@/types/booking";
import { COLLECTIONS } from "@/constants/constants";
import dayjs from "dayjs";
import { useDocument } from "@/hooks/useDocument";
import { GlobalSettings } from "@/types/global-settings";
import { SPECIAL_HOLIDAYS } from "@/constants/constants";
import { REGULAR_HOLIDAYS } from "@/constants/constants";

const now = dayjs();

export default function BookingPage() {
  const { user } = useUser();
  const { document: settings, loading } = useDocument<GlobalSettings>({
    collectionName: COLLECTIONS.GLOBAL_SETTINGS,
    documentId: process.env.NEXT_PUBLIC_FIREBASE_SETTINGS_ID!,
  });

  const timeSlots = getTimeRange({
    startTime: settings?.startOfDay ?? "08:00",
    endTime: settings?.endOfDay ?? "16:30",
    interval: settings?.hourInterval ?? "00:30",
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [isSuccess, setIsSuccess] = useState(false);

  const [currentDate, setCurrentDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );

  const [debounced] = useDebouncedValue(currentDate, 500);

  const [
    isBookingModalOpen,
    { open: openBookingModal, close: closeBookingModal },
  ] = useDisclosure();

  const successCallback = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setIsSuccess(true);
    setCurrentDate(dayjs().format("YYYY-MM-DD"));
  };

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
      where("date", "<=", endOfMonth)
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
      (error) => {
        console.error("Firestore onSnapshot error:", error);
      }
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
          href={!!user ? "/dashboard" : "/sign-in"}
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

        {!!user && <UserButton />}
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
            Thank you for scheduling with us — we&apos;re excited to have you!
            Your appointment is confirmed for your selected date and time, and
            you can view all the details anytime through your{" "}
            <Link href="/dashboard" style={{ color: "#2B4E45" }}>
              dashboard
            </Link>
            .
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
            <LoadingOverlay visible={loading} />
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
                withArrow
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
                    const targetDate = dayjs(date);
                    const dateStr = targetDate.format("YYYY-MM-DD");

                    // Check if it's a non-workday based on settings.workSchedule
                    const dayName = targetDate.format("dddd"); // e.g., 'Monday'
                    const isNonWorkday =
                      settings?.workSchedule &&
                      settings.workSchedule[dayName] === false;

                    // Check if it's a special holiday and enabled in settings
                    const monthDay = targetDate.format("MM/DD");
                    const specialHoliday = SPECIAL_HOLIDAYS.find(
                      (h) => h.date === monthDay
                    );
                    const isSpecialHoliday =
                      specialHoliday &&
                      settings?.specialHolidays?.[specialHoliday.id] === true;

                    // Check if it's a regular holiday and enabled in settings
                    const regularHoliday = REGULAR_HOLIDAYS.find(
                      (h) => h.date === monthDay
                    );
                    const isRegularHoliday =
                      regularHoliday &&
                      settings?.regularHolidays?.[regularHoliday.id] === true;

                    // Check if it's a specific date and not in specificDatesTime
                    const isSpecificDate =
                      settings?.specificDates?.includes(dateStr);
                    const hasSpecificTimes =
                      settings?.specificDatesTime &&
                      Object.prototype.hasOwnProperty.call(
                        settings.specificDatesTime,
                        dateStr
                      );
                    const isSpecificDateFullDisabled =
                      isSpecificDate && !hasSpecificTimes;

                    // Check if today and past 5PM
                    // const isToday = targetDate.isSame(now, "day");
                    // const isPastOfficeHours = isToday && now.hour() >= 17;

                    // Check if booking is at least 24 hours ahead
                    const isWithin24Hours =
                      dayjs(`${date} ${timeSlots[timeSlots.length - 1]}`).diff(
                        now,
                        "hour"
                      ) < 24;

                    // Check if all time slots are booked
                    const bookedTimes = bookings
                      .filter((booking) => booking.date === dateStr)
                      .map((b) => b.time);

                    const allTimesBooked = timeSlots.every((time) =>
                      bookedTimes.includes(time)
                    );

                    return (
                      isNonWorkday ||
                      isSpecialHoliday ||
                      isRegularHoliday ||
                      isSpecificDateFullDisabled ||
                      // isPastOfficeHours ||
                      allTimesBooked ||
                      isWithin24Hours
                    );
                  }}
                  minDate={new Date()}
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

                    // If selectedDate is in specificDates
                    const isSpecificDate = settings?.specificDates?.includes(
                      selectedDate ?? ""
                    );
                    const hasSpecificTimes =
                      settings?.specificDatesTime &&
                      Object.prototype.hasOwnProperty.call(
                        settings.specificDatesTime,
                        selectedDate ?? ""
                      );
                    if (isSpecificDate) {
                      if (!hasSpecificTimes) {
                        // All times should be disabled for this date
                        return true;
                      } else {
                        // Only disable the times listed in specificDatesTime
                        const disabledTimes =
                          settings.specificDatesTime[selectedDate ?? ""] || [];
                        // Compare only the time part (HH:mm:ss)
                        const timeStr = timeSlot.format("HH:mm:ss");
                        if (disabledTimes.includes(timeStr)) {
                          return true;
                        }
                      }
                    }

                    // Check if time slot is in the past
                    const isPastTime = timeSlot.isBefore(now);

                    // Check if time slot is within 24 hours
                    const isWithin24Hours = timeSlot.diff(now, "hour") < 24;

                    // Check if time slot is already booked
                    const isBooked = bookings.some(
                      (b) => b.date === selectedDate && b.time === time
                    );

                    return isPastTime || isWithin24Hours || isBooked;
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
      />
    </Container>
  );
}
