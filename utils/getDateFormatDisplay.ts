import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type DateLikeObject = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

type DateInput = string | number | Date | DateLikeObject | null | undefined;

const isDateLikeObject = (date: DateInput): date is DateLikeObject => {
  if (!date || typeof date !== "object" || date instanceof Date) return false;

  if (typeof date.toDate === "function") return true;

  return typeof date.seconds === "number" || typeof date._seconds === "number";
};

const toDateInput = (date: DateInput) => {
  if (!isDateLikeObject(date)) return date;

  if (typeof date.toDate === "function") return date.toDate();

  const seconds = date.seconds ?? date._seconds ?? 0;
  const nanoseconds = date.nanoseconds ?? date._nanoseconds ?? 0;

  return new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
};

export const getDateFormatDisplay = (
  date: DateInput,
  withTime: boolean = false,
) => {
  if (!date) return "";

  const timeFormat = isDateLikeObject(date) ? "h:mm a" : "h:mma";

  return dayjs(toDateInput(date)).format(
    `DD MMM YYYY ${withTime ? timeFormat : ""}`,
  );
};

const toDayjs = (date: DateInput) => {
  return dayjs(toDateInput(date));
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
