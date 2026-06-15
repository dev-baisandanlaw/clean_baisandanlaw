import AttorneyListing from "@/features/protected/attorneys/AttorneyListing";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Attorneys",
  description: "View and create accounts for your attorneys.",
};

export default async function AttorneysPage() {
  const user = await currentUser();

  if (user?.unsafeMetadata?.role !== "client") {
    redirect("/appointments?error=unauthorized");
  }

  return <AttorneyListing />;
}
