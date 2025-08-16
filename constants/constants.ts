import {
  IconLayoutDashboard,
  IconCalendar,
  IconUsers,
  IconGavel,
  IconBriefcase,
} from "@tabler/icons-react";

export const NAV_LINKS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: IconCalendar,
  },
  {
    label: "Attorneys",
    href: "/attorneys",
    icon: IconGavel,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: IconUsers,
  },
  {
    label: "Cases",
    href: "/cases",
    icon: IconBriefcase,
  },
];

export const COLLECTIONS = {
  BOOKINGS: "bookings",
  GLOBAL_SETTINGS: "global_settings",
  ATTORNEYS: "attorneys",
  CLIENTS: "clientUsers",
  CASES: "cases",
  TASKS: "tasks",
  CHANNELS: "channels",
};

export const PAYMONGO_CONFIG = {
  CHECKOUT_SESSION: "https://api.paymongo.com/v1/checkout_sessions",
  HEADERS: {
    Authorization: `Basic ${process.env.NEXT_PUBLIC_PAYMONGO_BASIC_AUTH}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

export const CLERK_ORG_IDS = {
  client: "org_31IqY6sWeNzuAE3mfzy70x17KeY",
  attorney: "org_31IqTFWQIBZGQv3FaQTlBw91XK4",
};

export const CLERK_API_CONFIG = {
  baseUrl: "https://api.clerk.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
};

export const REGULAR_HOLIDAYS = [
  { name: "New Year", date: "01/01", id: "new-year" },
  { name: "Araw ng Kagitingan", date: "04/09", id: "kagitingan" },
  { name: "Labor Day", date: "05/01", id: "labor-day" },
  { name: "Independence Day", date: "06/12", id: "independence-day" },
  { name: "Bonifacio Day", date: "11/30", id: "bonifacio-day" },
  { name: "Christmas Day", date: "12/25", id: "christmas-day" },
  { name: "Rizal Day", date: "12/30", id: "rizal-day" },
];

export const SPECIAL_HOLIDAYS = [
  {
    name: "EDSA People Power Revolution Anniversary",
    date: "02/25",
    id: "edsa",
  },
  { name: "Ninoy Aquino Day", date: "08/21", id: "ninoy" },
  { name: "All Saints Day Eve", date: "10/31", id: "all-saints-eve" },
  { name: "All Saints Day", date: "11/01", id: "all-saints" },
  {
    name: "Feast of the Immaculate Conception of Mary",
    date: "12/08",
    id: "immaculate-conception",
  },
  { name: "Christmas Eve", date: "12/24", id: "christmas-eve" },
  { name: "Last Day of the Year", date: "12/31", id: "last-day" },
];

export const WORK_SCHEDULE = [
  { name: "Monday", value: 1 },
  { name: "Tuesday", value: 2 },
  { name: "Wednesday", value: 3 },
  { name: "Thursday", value: 4 },
  { name: "Friday", value: 5 },
  { name: "Saturday", value: 6 },
  { name: "Sunday", value: 0 },
];

export const HOUR_INTERVAL = [
  { name: "15 Minutes", value: "00:15" },
  { name: "30 Minutes", value: "00:30" },
  { name: "45 Minutes", value: "00:45" },
  { name: "1 Hour", value: "01:00" },
  { name: "2 Hours", value: "02:00" },
  { name: "3 Hours", value: "03:00" },
  { name: "4 Hours", value: "04:00" },
  { name: "5 Hours", value: "05:00" },
  { name: "6 Hours", value: "06:00" },
];
