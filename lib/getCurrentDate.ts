import dayjs from "dayjs";

export const getCurrentDate = (withTime: boolean = true) => {
  if (withTime) return dayjs().format("YYYY-MM-DD HH:mm:ss");
  return dayjs().format("YYYY-MM-DD");
};
