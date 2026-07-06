import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type CheckDetailAccessOptions = {
  accessPath: string;
  listingPath: string;
  notFoundError: string;
};

export async function checkDetailAccessOrRedirect({
  accessPath,
  listingPath,
  notFoundError,
}: CheckDetailAccessOptions) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) redirect(`${listingPath}?error=unauthorized`);
  if (!apiUrl) redirect(`${listingPath}?error=unexpected_error`);

  const response = await fetch(`${apiUrl}/api/${accessPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) redirect(`${listingPath}?error=unexpected_error`);

  if (response.ok) return;
  if (response.status === 404) {
    redirect(`${listingPath}?error=${notFoundError}`);
  }
  if (response.status === 401 || response.status === 403) {
    redirect(`${listingPath}?error=unauthorized`);
  }

  redirect(`${listingPath}?error=unexpected_error`);
}
