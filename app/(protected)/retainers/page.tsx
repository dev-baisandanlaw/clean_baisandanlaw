import RetainerListing from "@/features/protected/retainers/RetainerListing";

export const metadata = {
  title: "Retainers",
  description: "View and manage all retainers.",
};

export default function RetainersPage() {
  return <RetainerListing />;
}
