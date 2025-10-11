import AttorneyListing from "@/features/protected/attorneys/AttorneyListing";

export const metadata = {
  title: "Attorneys",
  description: "View and create accounts for your attorneys.",
};

export default function AttorneysPage() {
  return <AttorneyListing />;
}
