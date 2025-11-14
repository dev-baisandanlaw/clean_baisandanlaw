import { NotificationData, notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import { createElement, ReactNode } from "react";

const defaultNotificationStyles: Partial<NotificationData> = {
  position: "top-center",
  autoClose: 3000,
};

type NotificationType = "success" | "error" | "info" | "warning";

const notificationConfig: Record<
  NotificationType,
  {
    color: string;
    icon: React.ReactNode;
    defaultTitle: string;
  }
> = {
  success: {
    color: "#198450",
    icon: createElement(IconCheck, { size: 20 }),
    defaultTitle: "Success",
  },
  error: {
    color: "red",
    icon: createElement(IconInfoCircle, { size: 20 }),
    defaultTitle: "Error",
  },
  info: {
    color: "blue",
    icon: createElement(IconInfoCircle, { size: 20 }),
    defaultTitle: "Info",
  },
  warning: {
    color: "brown",
    icon: createElement(IconAlertTriangle, { size: 20 }),
    defaultTitle: "Warning",
  },
};

// Internal factory
function notify(
  type: NotificationType,
  params: Partial<NotificationData> & { message: ReactNode }
) {
  const config = notificationConfig[type];
  notifications.show({
    ...defaultNotificationStyles,
    ...params,
    color: config.color,
    icon: params?.icon || config.icon,
    title: params.title || config.defaultTitle,
  });
}

export const appNotifications = {
  // custom notifications
  success: (params: Partial<NotificationData> & { message: ReactNode }) =>
    notify("success", params),

  error: (params: Partial<NotificationData> & { message: ReactNode }) =>
    notify("error", params),

  info: (params: Partial<NotificationData> & { message: ReactNode }) =>
    notify("info", params),

  warning: (params: Partial<NotificationData> & { message: ReactNode }) =>
    notify("warning", params),

  custom: (params: NotificationData) =>
    notifications.show({
      ...defaultNotificationStyles,
      ...params,
    }),

  // Mantine queue methods
  hide: (id: string) => notifications.hide(id),
  update: (data: NotificationData & { id: string }) =>
    notifications.update(data),
  clean: () => notifications.clean(),
  cleanQueue: () => notifications.cleanQueue(),
  updateState: notifications.updateState,
};
