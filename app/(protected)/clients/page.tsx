import ClientListing from "@/features/protected/clients/ClientListing";

export const metadata = {
  title: "Clients",
  description: "View the list of clients.",
};

export default function ClientsPage() {
  return <ClientListing />;
}
