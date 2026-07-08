import {
  IconCalendar,
  IconUsers,
  IconGavel,
  IconBriefcase,
  IconRubberStamp,
  IconCloud,
} from "@tabler/icons-react";

export const NAV_LINKS = [
  {
    label: "Appointments",
    href: "/appointments",
    icon: IconCalendar,
    roles: ["admin", "attorney", "client"],
  },
  {
    label: "Matters",
    href: "/matters",
    icon: IconBriefcase,
    roles: ["admin", "attorney", "client"],
  },
  {
    label: "Retainers",
    href: "/retainers",
    icon: IconCloud,
    roles: ["admin", "attorney", "client"],
  },
  {
    label: "Client Requests",
    href: "/client-requests",
    icon: IconRubberStamp,
    roles: ["admin", "attorney", "client"],
  },
  {
    label: "Attorneys",
    href: "/attorneys",
    icon: IconGavel,
    roles: ["admin"],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: IconUsers,
    roles: ["admin"],
  },
];

export const COLLECTIONS = {
  BOOKINGS: "bookings",
  GLOBAL_SETTINGS: "global_settings",
  GLOBAL_SCHED: "global_sched",
  ATTORNEYS: "attorneys",
  CLIENTS: "clientUsers",
  CASES: "cases",
  TASKS: "tasks",
  CHANNELS: "channels",
  NOTARY_REQUESTS: "notary_requests",
  MATTER_UPDATES: "matter_updates",
  RETAINERS: "retainers",
};

export const CLERK_API_CONFIG = {
  baseUrl: "https://api.clerk.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
};

export const ATTY_PRACTICE_AREAS = [
  "General Law",
  "Civil Law",
  "Criminal Law",
  "Family Law",
  "Labor Law",
  "Tax Law",
  "Real Estate Law",
  "Corporate Law",
  "Intellectual Property Law",
  "Immigration Law",
  "Environmental Law",
  "Bankruptcy Law",
  "Consumer Protection Law",
  "Human Rights Law",
  "Health Law",
  "Entertainment & Media Law",
  "International Law",
  "Elder Law",
  "Estate Planning & Probate Law",
  "Insurance Law",
  "Construction Law",
  "Maritime & Admiralty Law",
  "Military Law",
  "Education Law",
  "Sports Law",
  "Technology & Data Privacy Law",
  "Securities & Investment Law",
];
