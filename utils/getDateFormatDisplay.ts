import dayjs from "dayjs";

export const getDateFormatDisplay = (
  date: string | number | Date,
  withTime: boolean = false
) => {
  if (!date) return "";
  return dayjs(date).format(`DD MMM YYYY ${withTime ? "h:mm A" : ""}`);
};
