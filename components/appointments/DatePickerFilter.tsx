import { Booking } from "@/types/booking";
import { Indicator } from "@mantine/core";
import { DatePicker, DatePickerProps } from "@mantine/dates";
import dayjs from "dayjs";

interface AppointmentsDatePickerProps {
  bookings: Booking[];
  selectedDate: string | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentDate: React.Dispatch<React.SetStateAction<string>>;
}

export default function AppointmentsDatePicker({
  bookings,
  selectedDate,
  setSelectedDate,
  setCurrentDate,
}: AppointmentsDatePickerProps) {
  const dayRenderer: DatePickerProps["renderDay"] = (date) => {
    const day = dayjs(date).date();
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    const bookingsForDay = bookings.filter(
      (booking) => booking.date === formattedDate
    ).length;

    return (
      <Indicator
        inline
        label={bookingsForDay}
        size={12}
        offset={-5}
        position="top-end"
        styles={{ indicator: { fontSize: 10 } }}
        disabled={bookingsForDay === 0}
        zIndex={50}
      >
        <div>{day}</div>
      </Indicator>
    );
  };

  return (
    <DatePicker
      value={selectedDate}
      onChange={setSelectedDate}
      onDateChange={setCurrentDate}
      headerControlsOrder={["level", "previous", "next"]}
      hideOutsideDates
      renderDay={dayRenderer}
      styles={{
        calendarHeaderLevel: { justifyContent: "flex-start" },
        levelsGroup: {
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
        },
      }}
    />
  );
}
