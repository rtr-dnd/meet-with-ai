import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ToastAndroid,
  Platform,
} from "react-native";
import { useNotifee } from "@/hooks/useNotifee";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { agentsAtom } from "@/store/store";
import DateTimePicker from "@react-native-community/datetimepicker";

const AgentPage = () => {
  const { id } = useLocalSearchParams();

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Fallback for iOS (you could use a toast library)
      console.log(message);
    }
  };

  const scheduleCall = async () => {
    if (!agentName) {
      Alert.alert("エラー", "エージェント名が設定されていません");
      return;
    }

    if (selectedDate <= new Date()) {
      Alert.alert("エラー", "未来の日時を選択してください");
      return;
    }

    try {
      // Cancel existing notification if any
      if (agent?.params.notificationId) {
        await cancelIncomingCall(agent.params.notificationId);
      }

      const notificationId = await scheduleIncomingCall(
        agentName,
        selectedDate,
        id as string
      );
      console.log("Generated notification ID:", notificationId);

      // Update agent with notification ID and scheduled time
      await setPrompt(prompt || "");
      const updatedAgents = agents.map((a) =>
        a.id === agent?.id
          ? {
              ...a,
              params: {
                ...a.params,
                notificationId,
                scheduledTime: selectedDate.toISOString(),
              },
            }
          : a
      );
      await setAgents(updatedAgents);
      console.log("Agent updated with notification ID:", notificationId);

      showToast(`${selectedDate.toLocaleString()}に通話を予約しました`);
    } catch (error) {
      console.log("Error scheduling notification:", error);
      Alert.alert("エラー", "通知の設定に失敗しました");
    }
  };

  const cancelScheduledCall = async () => {
    if (agent?.params.notificationId) {
      try {
        console.log("Cancelling notification:", agent.params.notificationId);
        await cancelIncomingCall(agent.params.notificationId);
        const updatedAgents = agents.map((a) =>
          a.id === agent?.id
            ? {
                ...a,
                params: {
                  ...a.params,
                  notificationId: undefined,
                  scheduledTime: undefined,
                },
              }
            : a
        );
        await setAgents(updatedAgents);
        showToast("予約をキャンセルしました");
        console.log("Notification cancelled successfully");
      } catch (error) {
        console.log("Error cancelling notification:", error);
        Alert.alert("エラー", "予約のキャンセルに失敗しました");
      }
    } else {
      console.log("No notification ID found to cancel");
    }
  };

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const updateNow = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => {
      clearInterval(updateNow);
    };
  }, []);

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
        {agent?.params.scheduledTime &&
        new Date(agent.params.scheduledTime).getTime() > now ? (
          <View style={styles.scheduledInfo}>
            <Text style={styles.scheduledText}>
              予約済み: {new Date(agent.params.scheduledTime).toLocaleString()}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelScheduledCall}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              setSelectedDate(new Date());
              setShowScheduleDialog(true);
            }}
          >
            <Text style={styles.scheduleButtonText}>通話を予約</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Schedule Dialog */}
      <Modal
        visible={showScheduleDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>通話を予約</Text>

            <View style={styles.dialogContent}>
              <Text style={styles.sectionLabel}>日付</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>時刻</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>

              <Text style={styles.selectedTimeText}>
                選択済み: {selectedDate.toLocaleString()}
              </Text>
            </View>

            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.cancelDialogButton]}
                onPress={() => setShowScheduleDialog(false)}
              >
                <Text style={styles.cancelDialogButtonText}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogButton, styles.confirmDialogButton]}
                onPress={async () => {
                  setShowScheduleDialog(false);
                  await scheduleCall();
                }}
              >
                <Text style={styles.confirmDialogButtonText}>予約</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === "set" && date) {
              const newDate = new Date(selectedDate);
              newDate.setFullYear(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              );
              setSelectedDate(newDate);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (event.type === "set" && time) {
              const newDate = new Date(selectedDate);
              newDate.setHours(time.getHours(), time.getMinutes());
              setSelectedDate(newDate);
            }
          }}
        />
      )}
    </>
  );
};

export default AgentPage;

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
  scheduledInfo: {
    backgroundColor: "#e8f5e8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduledText: {
    color: "#2e7d32",
    fontSize: 14,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  scheduleButton: {
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  scheduleButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 320,
    maxWidth: "90%",
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  dialogContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  pickerButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  selectedTimeText: {
    fontSize: 16,
    color: "#4caf50",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f8f0",
    borderRadius: 8,
  },
  dialogButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelDialogButton: {
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  confirmDialogButton: {
    backgroundColor: "transparent",
  },
  cancelDialogButtonText: {
    fontSize: 16,
    color: "#666",
  },
  confirmDialogButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4caf50",
  },
});
