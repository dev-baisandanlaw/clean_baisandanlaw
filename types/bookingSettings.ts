export interface HolidaySetting {
  id: string;
  name: string;
  date: string;
  enabled: boolean;
}

export interface WorkScheduleSetting {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface BlockedScheduleSetting {
  id: string;
  date: string;
  timeSlots: string[];
  reason?: string;
}

export interface PaymentChannelSetting {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  enabled: boolean;
}

export interface BookingSettings {
  id?: string;
  key?: string;
  regularHolidays: HolidaySetting[];
  specialHolidays: HolidaySetting[];
  workSchedule: WorkScheduleSetting;
  officeHourStart: string;
  officeHourEnd: string;
  bookingIntervalMinutes: string;
  blockedSchedules: BlockedScheduleSetting[];
  appointmentFeePerHour: string;
  paymentChannels: PaymentChannelSetting[];
  attorneyCount: number;
}

export type UpdateBookingSettingsDto = Partial<
  Omit<BookingSettings, "id" | "key" | "appointmentFeePerHour"> & {
    appointmentFeePerHour: number;
  }
>;
