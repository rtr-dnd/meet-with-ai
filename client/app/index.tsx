import "react-native-get-random-values";
import React, { useCallback, useEffect } from "react";
import {
  View,
  AppRegistry,
  TouchableOpacity,
  Alert,
  FlatList,
  AppState,
} from "react-native";
import IncomingCallNotification from "@/components/IncomingCallNotification";
import { Stack, useRouter } from "expo-router";
import { v4 as uuidv4 } from "uuid";
import { useAtom } from "jotai";
import { Agent, agentsAtom, DEFAULT_AGENT_PARAMS } from "@/store/store";
import { MenuView, NativeActionEvent } from "@react-native-menu/menu";
import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons/Plus";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EllipsisVertical } from "@/lib/icons/EllipsisVertical";
import HeaderRight from "./HeaderRight";

const AgentCard = ({
  agent,
  onPress,
  deleteAgent,
}: {
  agent: Agent;
  onPress: () => void;
  deleteAgent: (id: string) => Promise<void>;
}) => {
  const menuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === "delete") {
      Alert.alert("エージェント削除", `${agent.params.name}を削除しますか？`, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => await deleteAgent(agent.id),
        },
      ]);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} className="mb-3">
      <Card className="w-full">
        <View className="w-full flex flex-row items-center">
          <CardHeader className="flex-1">
            <CardTitle>{agent.params.name}</CardTitle>
          </CardHeader>
          <MenuView
            isAnchoredToRight
            actions={[
              {
                id: "delete",
                title: "削除",
                attributes: {
                  destructive: true,
                },
              },
            ]}
            onPressAction={menuAction}
          >
            <Button size="icon" variant="ghost" className="mr-4">
              <EllipsisVertical className="size-4" />
            </Button>
          </MenuView>
        </View>
        <CardContent>
          <Text>{agent.params.prompt}</Text>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

const Index = () => {
  const router = useRouter();
  const [agents, setAgents] = useAtom(agentsAtom);

  const createAgent = async () => {
    const id = uuidv4();
    await setAgents([
      ...agents,
      {
        id: id,
        params: DEFAULT_AGENT_PARAMS,
      },
    ]);
    return id;
  };

  const deleteAgent = async (id: string) => {
    const updatedAgents = agents.filter((agent) => agent.id !== id);
    await setAgents(updatedAgents);
  };

  const checkBackgroundCall = useCallback(async () => {
    try {
      const shouldShowCallId = await AsyncStorage.getItem(
        "shouldShowIncomingCall"
      );
      const shouldStartCallId = await AsyncStorage.getItem(
        "shouldStartRealtimeCall"
      );
      console.log(
        `shouldShowCall: ${shouldShowCallId}, shouldStartCall: ${shouldStartCallId}`
      );

      if (shouldStartCallId) {
        console.log("Starting realtime call directly from background");
        router.push({
          pathname: "/realtime-call/[id]",
          params: { id: shouldStartCallId },
        });
      } else if (shouldShowCallId) {
        console.log("Showing notification");
        router.push({
          pathname: "/incoming-call/[id]",
          params: { id: shouldShowCallId },
        });
      }

      await AsyncStorage.removeItem("shouldStartRealtimeCall");
      await AsyncStorage.removeItem("shouldShowIncomingCall");
    } catch (error) {
      console.log("Error checking background call:", error);
    }
  }, [router]);

  useEffect(() => {
    checkBackgroundCall();

    // watch for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      console.log("AppState changed to:", nextAppState);
      if (nextAppState === "active") {
        console.log("App became active, checking background call");
        checkBackgroundCall();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [checkBackgroundCall]);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log("Foreground event:", type, detail);

      if (type === EventType.ACTION_PRESS) {
        console.log("Action pressed:", detail.pressAction?.id);
        if (detail.pressAction?.id.startsWith("answer_")) {
          console.log("Answer action - starting call");
          const id = detail.pressAction.id.split("_")[1];
          router.push({
            pathname: "/realtime-call/[id]",
            params: { id: id },
          });
        } else if (detail.pressAction?.id.startsWith("decline_")) {
          console.log("Decline action - dismissing call");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Meet with AI",
          headerRight: () => <HeaderRight clearAgents={() => setAgents([])} />,
        }}
      />
      <View className="flex-1 bg-background p-4">
        <FlatList
          data={agents}
          keyExtractor={(item) => item.id}
          renderItem={({ item: agent }) => (
            <AgentCard
              agent={agent}
              onPress={() => {
                router.push({
                  pathname: "/agent/[id]",
                  params: { id: agent.id },
                });
              }}
              deleteAgent={deleteAgent}
            />
          )}
          ListEmptyComponent={
            <View className="flex items-center justify-center">
              <Text className="text-muted-foreground">
                まだエージェントがありません
              </Text>
            </View>
          }
        />

        <View className="absolute left-0 right-0 bottom-8 flex-col items-center">
          <Button
            onPress={async () => {
              const id = await createAgent();
              router.push({
                pathname: "/agent/[id]",
                params: { id },
              });
            }}
            size="lg"
            className="flex flex-row gap-4 items-center pl-4"
          >
            <Plus className="text-primary-foreground" />
            <Text className="text-primary-foreground font-bold text-lg">
              エージェントを作成
            </Text>
          </Button>
        </View>
      </View>
    </>
  );
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("Background event:", type, detail);
  console.log(
    "fullscreen action: ",
    detail.notification?.android?.fullScreenAction?.id
  );

  if (type === EventType.ACTION_PRESS) {
    if (detail.pressAction?.id.startsWith("answer_")) {
      const id = detail.pressAction.id.split("_")[1];
      await AsyncStorage.setItem("shouldStartRealtimeCall", id);
      console.log("Answer pressed in background, setting realtime call flag");
    } else if (detail.pressAction?.id.startsWith("decline_")) {
      const id = detail.pressAction.id.split("_")[1];
      await notifee.cancelNotification(id);
      console.log("Decline pressed in background");
    }
  }

  if (
    (type === EventType.PRESS || type === EventType.DELIVERED) &&
    detail.notification?.android?.fullScreenAction?.id.startsWith(
      "incoming-call-notification_"
    )
  ) {
    const id = detail.notification.android.fullScreenAction.id.split("_")[1];
    console.log("Fullscreen notification triggered in background");
    await AsyncStorage.setItem("shouldShowIncomingCall", id);
  }
});

AppRegistry.registerComponent(
  "incoming-call-notification",
  () => IncomingCallNotification
);

export default Index;
