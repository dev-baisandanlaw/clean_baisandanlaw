import RetainerListing from "@/features/protected/retainers/RetainerListing";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Retainers",
  description: "View and manage all retainers.",
};

async function getCurrentSubscription(clientEmail: string) {
  const { getToken } = await auth();
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) return null;

  try {
    const response = await fetch(
      `${apiUrl}/api/subscriptions/clients/${encodeURIComponent(
        clientEmail,
      )}/current`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const text = await response.text();

    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default async function RetainersPage() {
  const user = await currentUser();

  if (user?.unsafeMetadata?.role === "client") {
    const email = user.emailAddresses[0]?.emailAddress;
    const subscription = email ? await getCurrentSubscription(email) : null;

    if (!subscription) {
      redirect("/appointments?error=subscription_required");
    }
  }

  return <RetainerListing />;
}
