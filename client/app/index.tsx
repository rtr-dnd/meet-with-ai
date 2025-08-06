import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  AppRegistry,
  AppState,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import RealtimeCall from "../components/RealtimeCall";
import { useNotifee } from "../hooks/useNotifee";
import notifee, { EventType } from "@notifee/react-native";
import IncomingCallNotification from "@/components/IncomingCallNotification";
import { Stack } from "expo-router";
import { ToastAndroid, Platform } from "react-native";
enum VisibleScreen {
  Default,
  RealtimeCall,
  IncomingCall,
}

const DEFAULT_AGENT_NAME = "AIエージェント";
const DEFAULT_PROMPT =
  "あなたはAIエージェントです。ユーザーの質問に答え、会話を続けてください。日本語で話してください。この文章を読んだら、「インストラクションを参照しました」と答えてください。";

enum ServerType {
  Local = "local",
  Vercel = "vercel",
}

const VERCEL_URL = "https://meet-with-ai-server.vercel.app"; // TODO: Replace with actual Vercel URL
const DEFAULT_LOCAL_URL = "http://192.168.11.6:3001";

const Index = () => {
  const [visibleScreen, setVisibleScreen] = useState<VisibleScreen>(
    VisibleScreen.Default
  );
  const { scheduleIncomingCall, cancelIncomingCall } = useNotifee();
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_NAME);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [serverType, setServerType] = useState<ServerType>(ServerType.Local);
  const [localUrl, setLocalUrl] = useState(DEFAULT_LOCAL_URL);

  // Load saved data on app start
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedAgentName = await AsyncStorage.getItem("agentName");
        const savedPrompt = await AsyncStorage.getItem("prompt");
        const savedServerType = await AsyncStorage.getItem("serverType");
        const savedLocalUrl = await AsyncStorage.getItem("localUrl");

        if (savedAgentName) setAgentName(savedAgentName);
        if (savedPrompt) setPrompt(savedPrompt);
        if (savedServerType) setServerType(savedServerType as ServerType);
        if (savedLocalUrl) setLocalUrl(savedLocalUrl);
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  // Save data when changed
  const updateAgentName = async (name: string) => {
    setAgentName(name);
    try {
      await AsyncStorage.setItem("agentName", name);
    } catch (error) {
      console.error("Failed to save agent name:", error);
    }
  };

  const updatePrompt = async (newPrompt: string) => {
    setPrompt(newPrompt);
    try {
      await AsyncStorage.setItem("prompt", newPrompt);
    } catch (error) {
      console.error("Failed to save prompt:", error);
    }
  };

  const updateServerType = async (type: ServerType) => {
    setServerType(type);
    try {
      await AsyncStorage.setItem("serverType", type);
    } catch (error) {
      console.error("Failed to save server type:", error);
    }
  };

  const updateLocalUrl = async (url: string) => {
    setLocalUrl(url);
    try {
      await AsyncStorage.setItem("localUrl", url);
    } catch (error) {
      console.error("Failed to save local URL:", error);
    }
  };

  const getCurrentServerUrl = () => {
    return serverType === ServerType.Vercel ? VERCEL_URL : localUrl;
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

  const testServerConnection = async () => {
    try {
      const serverUrl = getCurrentServerUrl();
      const response = await fetch(`${serverUrl}/api/test`);
      const data = await response.json();
      Alert.alert("サーバテスト", `${data.message}\n\nURL: ${serverUrl}`);
    } catch (error) {
      Alert.alert(
        "エラー",
        `サーバに接続できませんでした\n\nURL: ${getCurrentServerUrl()}`
      );
    }
  };

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
          title: "Meet with AI",
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={testServerConnection}>
                <MaterialIcons name="warning" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>サーバー設定</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateServerType(ServerType.Local)}
            >
              <View
                style={[
                  styles.radio,
                  serverType === ServerType.Local && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>ローカル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateServerType(ServerType.Vercel)}
            >
              <View
                style={[
                  styles.radio,
                  serverType === ServerType.Vercel && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>Vercel</Text>
            </TouchableOpacity>
          </View>
          {serverType === ServerType.Local && (
            <TextInput
              value={localUrl}
              onChangeText={updateLocalUrl}
              placeholder="ローカルサーバーURL..."
              style={styles.input}
            />
          )}
          {serverType === ServerType.Vercel && (
            <Text style={styles.urlDisplay}>{VERCEL_URL}</Text>
          )}
        </View>

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
          serverUrl={getCurrentServerUrl()}
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

AppRegistry.registerComponent(
  "incoming-call-notification",
  () => IncomingCallNotification
);

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  inputContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
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
  radioContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  radioSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  radioText: {
    fontSize: 16,
  },
  urlDisplay: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
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
