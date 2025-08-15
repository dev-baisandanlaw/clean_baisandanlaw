export interface GlobalSettings {
  specificDates: string[];
  regularHolidays: Record<string, boolean>;
  specialHolidays: Record<string, boolean>;
  workSchedule: Record<string, boolean>;
  hourInterval: string;
  specificDatesTime: Record<string | number, string[]>;
  startOfDay: string;
  endOfDay: string;
}
