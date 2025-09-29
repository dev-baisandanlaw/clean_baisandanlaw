import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

export const getDateFormatDisplay = (
  date: string | number | Date | Timestamp,
  withTime: boolean = false
) => {
  if (!date) return "";
  if (date instanceof Timestamp)
    return dayjs(date.toDate()).format(
      `DD MMM YYYY ${withTime ? "h:mm A" : ""}`
    );
  return dayjs(date).format(`DD MMM YYYY ${withTime ? "h:mm A" : ""}`);
};
