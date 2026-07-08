import ClientListing from "@/features/protected/clients/ClientListing";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Clients",
  description: "View the list of clients.",
};

export default async function ClientsPage() {
  const user = await currentUser();

  if (user?.unsafeMetadata?.role !== "admin") {
    redirect("/appointments?error=unauthorized");
  }

  return <ClientListing />;
}
