import { ThreadGroupData, ThreadNotificationState } from "../../../services/notifications/threads";

export type ThreadNotification = {
  type: "thread";
  data: ThreadGroupData;
  timestamp: number;
};

/**
 * Convert the notification state into a sorted array of notifications
 */
export function getNotificationsFromState(state: ThreadNotificationState): ThreadNotification[] {
  const notifications: ThreadNotification[] = [];

  // Add thread groups
  for (const group of state.threadGroups.values()) {
    notifications.push({
      type: "thread",
      data: group,
      timestamp: group.latest,
    });
  }

  // Sort by timestamp (newest first)
  notifications.sort((a, b) => b.timestamp - a.timestamp);

  return notifications;
}
