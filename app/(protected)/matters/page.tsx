import MattersListing from "@/features/protected/matters/MattersListing";

export const metadata = {
  title: "Matters",
  description: "View and manage all matters.",
};

export default function MattersPage() {
  return <MattersListing />;
}
