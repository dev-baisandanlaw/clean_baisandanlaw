import AppointmentsFeature from "@/features/protected/appointments/AppointmentsFeature";

export const metadata = {
  title: "Appointments",
  description: "View and manage your appointments.",
};

export default function AppointmentsPage() {
  return <AppointmentsFeature />;
}
