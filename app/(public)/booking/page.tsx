"use client";

import logo from "@/public/images/logo.png";
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
} from "@mantine/core";
import { DatePicker, getTimeRange, TimeGrid } from "@mantine/dates";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconHome, IconRocket } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "@/components/Appshell.module.css";
import classes from "./Booking.module.css";

import dayjs from "dayjs";
import RevampedBookingModal from "@/components/booking/RevampedBookingModal";
import {
  useGetBookingSettingsQuery,
  useGetPublicBookingsByMonthQuery,
} from "@/store/services/bookingService";

const WORK_DAY_VALUES = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export default function BookingPage() {
  const { user, isLoaded } = useUser();
  const { data: bookingSettings, isFetching: isFetchingBookingSettings } =
    useGetBookingSettingsQuery();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  const [currentDate, setCurrentDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  const [debounced] = useDebouncedValue(currentDate, 500);
  const { data: bookings = [], isFetching: isFetchingBookings } =
    useGetPublicBookingsByMonthQuery({ month: debounced });

  const [
    isBookingModalOpen,
    { open: openBookingModal, close: closeBookingModal },
  ] = useDisclosure();

  const validHolidays = useMemo(() => {
    if (!bookingSettings) return [];

    return [
      ...bookingSettings.regularHolidays,
      ...bookingSettings.specialHolidays,
    ]
      .filter((holiday) => holiday.enabled)
      .map((holiday) => holiday.date);
  }, [bookingSettings]);

  const workDays = useMemo(() => {
    if (!bookingSettings) return [];

    return Object.entries(bookingSettings.workSchedule)
      .filter(([, isEnabled]) => isEnabled)
      .map(([day]) => WORK_DAY_VALUES[day as keyof typeof WORK_DAY_VALUES]);
  }, [bookingSettings]);

  const timeSlots = useMemo(() => {
    if (!bookingSettings) return [];

    return getTimeRange({
      startTime: bookingSettings.officeHourStart,
      endTime: bookingSettings.officeHourEnd,
      interval: `${bookingSettings.bookingIntervalMinutes}:00`,
    });
  }, [bookingSettings]);

  const attorneyCount = bookingSettings?.attorneyCount ?? 0;

  const bookingCountBySlot = useMemo(
    () =>
      bookings.reduce(
        (map, booking) =>
          map.set(
            `${booking.date}-${booking.time}`,
            (map.get(`${booking.date}-${booking.time}`) ?? 0) + 1,
          ),
        new Map<string, number>(),
      ),
    [bookings],
  );

  const isTimeUnavailable = (date: string, time: string) => {
    const timeSlot = dayjs(`${date} ${time}`);
    const blockedSchedule = bookingSettings?.blockedSchedules.find(
      (schedule) => schedule.date === date,
    );
    const bookingCount = bookingCountBySlot.get(`${date}-${time}`) ?? 0;

    if (timeSlot.isBefore(dayjs().add(1, "day"))) return true;
    if (blockedSchedule?.timeSlots.includes(time)) return true;
    if (attorneyCount > 0 && bookingCount >= attorneyCount) return true;

    return false;
  };

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

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
            title="Your booking is submitted"
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
            Thank you for scheduling with us — we’re excited to speak with you!
            Your appointment has been submitted, and our staff may call you if
            they need any additional information regarding your request.
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
                isFetchingBookingSettings || isFetchingBookings || !isLoaded
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
                    const selectedDate = dayjs(date).format("YYYY-MM-DD");
                    const monthDay = dayjs(date).format("MM-DD");

                    // if holiday, return true
                    if (validHolidays.includes(monthDay)) return true;

                    // if it's not a work day, return true
                    if (!workDays.includes(dayjs(date).day())) return true;

                    if (
                      timeSlots.length > 0 &&
                      timeSlots.every((time) =>
                        isTimeUnavailable(selectedDate, time),
                      )
                    )
                      return true;

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
                    if (!selectedDate) return true;

                    return isTimeUnavailable(selectedDate, time);
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

      <RevampedBookingModal
        opened={isBookingModalOpen}
        onClose={closeBookingModal}
        selectedDate={selectedDate || ""}
        selectedTime={selectedTime || ""}
      />
    </Container>
  );
}
