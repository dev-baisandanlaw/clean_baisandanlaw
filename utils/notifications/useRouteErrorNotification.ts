"use client";

import { useEffect, useRef } from "react";

import { appNotifications } from "@/utils/notifications/notifications";

type RouteErrorEntity = "matter" | "retainer" | "client request";

type UseRouteErrorNotificationOptions = {
  entity?: RouteErrorEntity;
};

const notFoundMessages: Record<RouteErrorEntity, string> = {
  matter: "The matter was not found.",
  retainer: "The retainer was not found.",
  "client request": "The client request was not found.",
};

const unauthorizedMessages: Record<RouteErrorEntity, string> = {
  matter: "You do not have access to this matter.",
  retainer: "You do not have access to this retainer.",
  "client request": "You do not have access to this client request.",
};

const errorMessages: Record<string, string> = {
  matter_not_found: notFoundMessages.matter,
  retainer_not_found: notFoundMessages.retainer,
  client_request_not_found: notFoundMessages["client request"],
  notary_request_not_found: notFoundMessages["client request"],
  subscription_required: "A subscription is required to access retainers.",
  unexpected_error: "Something went wrong. Please try again.",
};

function getRouteErrorMessage(
  error: string,
  entity?: RouteErrorEntity,
): string {
  if (entity && (error === "not_found" || error === `${entity}_not_found`)) {
    return notFoundMessages[entity];
  }

  if (error === "unauthorized" || error === "forbidden") {
    return entity
      ? unauthorizedMessages[entity]
      : "You do not have access to that page.";
  }

  return errorMessages[error] ?? errorMessages.unexpected_error;
}

function clearRouteErrorFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete("error");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function useRouteErrorNotification(
  options: UseRouteErrorNotificationOptions = {},
) {
  const handledErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const error = new URL(window.location.href).searchParams.get("error");

    if (!error || handledErrorRef.current === error) return;

    const message = getRouteErrorMessage(error, options.entity);

    handledErrorRef.current = error;
    clearRouteErrorFromUrl();

    appNotifications.error({
      title: "An error occurred",
      message,
    });
  }, [options.entity]);
}
