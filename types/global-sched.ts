export interface RegularHolidays {
  "new-year": boolean;
  kagitingan: boolean;
  "labor-day": boolean;
  "independence-day": boolean;
  "bonifacio-day": boolean;
  "christmas-day": boolean;
  "rizal-day": boolean;
}

export interface SpecialHolidays {
  edsa: boolean;
  ninoy: boolean;
  "all-saints-eve": boolean;
  "all-saints": boolean;
  "immaculate-conception": boolean;
  "christmas-eve": boolean;
  "last-day": boolean;
}

export interface WorkSchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface GlobalSched {
  regularHolidays: RegularHolidays;
  specialHolidays: SpecialHolidays;
  workSchedule: WorkSchedule;

  blockedDates: Record<string, string[]>;
}
