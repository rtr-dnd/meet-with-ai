import { useCallback } from "react";
import notifee, {
  AndroidCategory,
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from "@notifee/react-native";

export const useNotifee = () => {
  const requestPermission = useCallback(async () => {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus;
  }, []);

  const scheduleIncomingCall = useCallback(
    async (
      agentName: string,
      scheduledTime: Date,
      agentId: string
    ): Promise<string> => {
      await requestPermission();

      const channelId = await notifee.createChannel({
        id: "incoming-call",
        name: "Incoming Call",
        importance: AndroidImportance.HIGH,
        sound: "default",
      });

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledTime.getTime(),
      };

      const notificationId = await notifee.createTriggerNotification(
        {
          title: `📞 ${agentName}`,
          body: "着信通知です - タップして応答",
          android: {
            channelId,
            category: AndroidCategory.CALL,
            importance: AndroidImportance.HIGH,
            fullScreenAction: {
              id: `incoming-call-notification_${agentId}`,
            },
            actions: [
              {
                title: "📞 応答",
                pressAction: {
                  id: `answer_${agentId}`,
                  launchActivity: "default",
                },
              },
              {
                title: "❌ 拒否",
                pressAction: {
                  id: `decline_${agentId}`,
                },
              },
            ],
          },
        },
        trigger
      );

      console.log(
        `Notification scheduled for ${scheduledTime.toLocaleString()}`
      );
      return notificationId;
    },
    [requestPermission]
  );

  const cancelIncomingCall = useCallback(async (notificationId?: string) => {
    if (notificationId) {
      await notifee.cancelTriggerNotification(notificationId);
      await notifee.cancelNotification(notificationId);
    } else {
      await notifee.cancelAllNotifications();
    }
  }, []);

  return {
    scheduleIncomingCall,
    cancelIncomingCall,
    requestPermission,
  };
};
