import type { GetToken } from "@clerk/types";

let clerkGetToken: GetToken | null = null;

export function setClerkGetToken(getToken: GetToken | null) {
  clerkGetToken = getToken;
}

export async function getClerkToken() {
  if (!clerkGetToken) return null;
  return clerkGetToken();
}
