import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  AppState,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RealtimeCall from "@/components/RealtimeCall";
import { useNotifee } from "@/hooks/useNotifee";
import notifee, { EventType } from "@notifee/react-native";
import IncomingCallNotification from "@/components/IncomingCallNotification";
import { Stack, useLocalSearchParams } from "expo-router";
import { ToastAndroid, Platform } from "react-native";
import { useAtom, useAtomValue } from "jotai";
import { agentsAtom, currentServerUrlAtom } from "@/store/store";

enum VisibleScreen {
  Default,
  RealtimeCall,
  IncomingCall,
}

const Index = () => {
  const { id } = useLocalSearchParams();
  const currentServerUrl = useAtomValue(currentServerUrlAtom);

  const [visibleScreen, setVisibleScreen] = useState<VisibleScreen>(
    VisibleScreen.Default
  );
  const { scheduleIncomingCall, cancelIncomingCall } = useNotifee();
  const [agents, setAgents] = useAtom(agentsAtom);
  const agent = agents.find((e) => e.id === id);
  const { name: agentName, prompt } = agent?.params || {};

  const setAgentName = async (name: string) => {
    if (!agent) return;
    const updatedAgents = agents.map((a) =>
      a.id === agent.id ? { ...a, params: { ...a.params, name } } : a
    );
    await setAgents(updatedAgents);
  };

  const setPrompt = async (newPrompt: string) => {
    if (!agent) return;
    const updatedAgents = agents.map((a) =>
      a.id === agent.id
        ? { ...a, params: { ...a.params, prompt: newPrompt } }
        : a
    );
    await setAgents(updatedAgents);
  };

  // Save data when changed
  const updateAgentName = async (name: string) => {
    await setAgentName(name);
  };

  const updatePrompt = async (newPrompt: string) => {
    await setPrompt(newPrompt);
  };

  // check background call status
  const checkBackgroundCall = async () => {
    try {
      const shouldShowCall = await AsyncStorage.getItem(
        "shouldShowIncomingCall"
      );
      const shouldStartCall = await AsyncStorage.getItem(
        "shouldStartRealtimeCall"
      );

      if (shouldStartCall === "true") {
        console.log("Starting realtime call directly from background");
        setVisibleScreen(VisibleScreen.RealtimeCall);
      } else if (shouldShowCall === "true") {
        setVisibleScreen(VisibleScreen.IncomingCall);
      }

      await AsyncStorage.removeItem("shouldStartRealtimeCall");
      await AsyncStorage.removeItem("shouldShowIncomingCall");
    } catch (error) {
      console.log("Error checking background call:", error);
    }
  };

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
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log("Foreground event:", type, detail);

      if (type === EventType.ACTION_PRESS) {
        console.log("Action pressed:", detail.pressAction?.id);
        if (detail.pressAction?.id === "answer") {
          console.log("Answer action - starting call");
          cancelIncomingCall();
          setVisibleScreen(VisibleScreen.RealtimeCall);
        } else if (detail.pressAction?.id === "decline") {
          console.log("Decline action - dismissing call");
          cancelIncomingCall();
          setVisibleScreen(VisibleScreen.Default);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cancelIncomingCall]);

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Fallback for iOS (you could use a toast library)
      console.log(message);
    }
  };

  const triggerIncomingCall = async () => {
    try {
      showToast("10秒後に着信通知を表示します");
      await scheduleIncomingCall(agentName);
    } catch (error) {
      console.log("Error scheduling notification:", error);
      Alert.alert("エラー", "通知の設定に失敗しました");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: agentName || (id as string),
        }}
      />
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>エージェント名</Text>
          <TextInput
            value={agentName}
            onChangeText={updateAgentName}
            placeholder="エージェント名を入力..."
            style={styles.input}
          />
        </View>
        <View
          style={{
            ...styles.inputContainer,
            flex: 1,
          }}
        >
          <Text style={styles.inputLabel}>プロンプト</Text>
          <TextInput
            multiline
            value={prompt}
            onChangeText={updatePrompt}
            placeholder="プロンプトを入力..."
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          style={styles.incomingCallButton}
          onPress={triggerIncomingCall}
        >
          <Text style={styles.incomingCallButtonText}>10秒後に通話を予約</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={visibleScreen === VisibleScreen.IncomingCall}
        animationType="fade"
        presentationStyle="fullScreen"
      >
        <IncomingCallNotification
          onAnswer={() => {
            setVisibleScreen(VisibleScreen.RealtimeCall);
          }}
          onDecline={() => {
            setVisibleScreen(VisibleScreen.Default);
          }}
          callerName={agentName}
        />
      </Modal>

      <Modal
        visible={visibleScreen === VisibleScreen.RealtimeCall}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <RealtimeCall
          onClose={() => setVisibleScreen(VisibleScreen.Default)}
          prompt={prompt}
          agentName={agentName}
          serverUrl={currentServerUrl}
        />
      </Modal>
    </>
  );
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("Background event:", type, detail);

  if (type === EventType.ACTION_PRESS) {
    if (detail.pressAction?.id === "answer") {
      await AsyncStorage.setItem("shouldStartRealtimeCall", "true");
      console.log("Answer pressed in background, setting realtime call flag");
    } else if (detail.pressAction?.id === "decline") {
      await notifee.cancelAllNotifications();
      console.log("Decline pressed in background");
    }
  }

  if (
    (type === EventType.PRESS || type === EventType.DELIVERED) &&
    detail.notification?.android?.fullScreenAction?.id ===
      "incoming-call-notification"
  ) {
    console.log("Fullscreen notification triggered in background");
    await AsyncStorage.setItem("shouldShowIncomingCall", "true");
  }
});

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    opacity: 0.5,
    paddingHorizontal: 4,
  },
  input: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 16,
  },
  incomingCallButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 16,
  },
  incomingCallButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
