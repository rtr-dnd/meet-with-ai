import "react-native-get-random-values";
import React, { useCallback, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
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
import { agentsAtom, DEFAULT_AGENT_PARAMS } from "@/store/store";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { MenuView, MenuComponentRef } from "@react-native-menu/menu";
import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TestConnectionButton from "./TestConnectionButton";
import ServerSettingsButton from "./ServerSettingsButton";

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
          headerRight: () => (
            <View style={styles.headerActions}>
              <TestConnectionButton />
              <ServerSettingsButton />
              <TouchableOpacity onPress={() => setAgents([])}>
                <MaterialIcons name="refresh" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={agents}
          keyExtractor={(item) => item.id}
          style={styles.agentList}
          renderItem={({ item: agent }) => (
            <TouchableOpacity
              style={styles.agentCard}
              onPress={() => {
                router.push({
                  pathname: "/agent/[id]",
                  params: { id: agent.id },
                });
              }}
            >
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.params.name}</Text>
                <Text style={styles.agentPrompt} numberOfLines={2}>
                  {agent.params.prompt}
                </Text>
              </View>
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
                onPressAction={({ nativeEvent }) => {
                  if (nativeEvent.event === "delete") {
                    Alert.alert(
                      "エージェント削除",
                      `${agent.params.name}を削除しますか？`,
                      [
                        { text: "キャンセル", style: "cancel" },
                        {
                          text: "削除",
                          style: "destructive",
                          onPress: async () => await deleteAgent(agent.id),
                        },
                      ]
                    );
                  }
                }}
              >
                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="more-vert" size={24} color="#666" />
                </TouchableOpacity>
              </MenuView>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>まだエージェントがありません</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={async () => {
            const id = await createAgent();
            router.push({
              pathname: "/agent/[id]",
              params: { id },
            });
          }}
        >
          <MaterialIcons
            name="add"
            size={24}
            color="#fff"
            style={styles.createIcon}
          />
          <Text style={styles.createButtonText}>新しいエージェントを作成</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  agentList: {
    flex: 1,
  },
  agentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentInfo: {
    flex: 1,
    marginRight: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  agentPrompt: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#9C27B0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  createIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
    marginRight: 8,
  },
  // Menu styles
  menuOptions: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
  },
  menuOptionText: {
    fontSize: 16,
    color: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
