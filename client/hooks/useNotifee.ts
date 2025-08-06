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

  const scheduleIncomingCall = useCallback(async (agentName?: string) => {
    await requestPermission();

    const channelId = await notifee.createChannel({
      id: "incoming-call",
      name: "Incoming Call",
      importance: AndroidImportance.HIGH,
      sound: "default",
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + 10000,
    };

    await notifee.createTriggerNotification(
      {
        title: `📞 ${agentName || "AI Agent"}`,
        body: "着信通知です - タップして応答",
        android: {
          channelId,
          category: AndroidCategory.CALL,
          importance: AndroidImportance.HIGH,
          fullScreenAction: {
            id: "incoming-call-notification",
          },
          actions: [
            {
              title: "📞 応答",
              pressAction: {
                id: "answer",
                launchActivity: "default",
              },
            },
            {
              title: "❌ 拒否",
              pressAction: {
                id: "decline",
              },
            },
          ],
        },
      },
      trigger
    );

    console.log("Notification scheduled for 5 seconds later");
  }, [requestPermission]);

  const cancelIncomingCall = useCallback(async () => {
    await notifee.cancelAllNotifications();
  }, []);

  return {
    scheduleIncomingCall,
    cancelIncomingCall,
    requestPermission,
  };
};
