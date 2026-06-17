"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkGetToken } from "@/lib/clerkToken";

export function ClerkTokenProvider() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setClerkGetToken(() => getToken({ skipCache: true }));
    } else {
      setClerkGetToken(null);
    }

    return () => {
      setClerkGetToken(null);
    };
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}
