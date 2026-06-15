import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Timestamp } from "firebase/firestore";

dayjs.extend(relativeTime);

type DateInput = string | number | Date | Timestamp;

export const getDateFormatDisplay = (
  date: string | number | Date | Timestamp,
  withTime: boolean = false,
) => {
  if (!date) return "";
  if (date instanceof Timestamp)
    return dayjs(date.toDate()).format(
      `DD MMM YYYY ${withTime ? "h:mm a" : ""}`,
    );
  return dayjs(date).format(`DD MMM YYYY ${withTime ? "h:mma" : ""}`);
};

const toDayjs = (date: DateInput) => {
  return date instanceof Timestamp ? dayjs(date.toDate()) : dayjs(date);
};

export const getRelativeDateDisplay = (
  date: DateInput,
  withTime: boolean = true,
) => {
  if (!date) return "";

  const value = toDayjs(date);

  if (!value.isValid()) return "";

  const now = dayjs();

  if (value.isSame(now.subtract(1, "day"), "day")) {
    return `Yesterday${withTime ? ` at ${value.format("h:mm A")}` : ""}`;
  }

  return value.fromNow();
};
