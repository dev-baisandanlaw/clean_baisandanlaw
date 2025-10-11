import NotaryRequestsListing from "@/features/protected/notary-requests/NotaryRequestsListing";

export const metadata = {
  title: "Notary Requests",
  description: "View and manage all notary requests.",
};

export default function NotaryRequestsPage() {
  return <NotaryRequestsListing />;
}
