import NotaryRequestsListing from "@/features/protected/notary-requests/NotaryRequestsListing";

export const metadata = {
  title: "Client Requests",
  description: "View and manage all client requests.",
};

export default function NotaryRequestsPage() {
  return <NotaryRequestsListing />;
}
