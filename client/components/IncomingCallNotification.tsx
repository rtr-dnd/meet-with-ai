import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface IncomingCallNotificationProps {
  onAnswer: () => void;
  onDecline: () => void;
  callerName?: string;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  onAnswer,
  onDecline,
  callerName = "AI Agent",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callStatus}>着信中...</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.buttonText}>拒否</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.answerButton} onPress={onAnswer}>
          <Text style={styles.buttonText}>応答</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  callInfo: {
    alignItems: "center",
    marginBottom: 100,
  },
  callerName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  callStatus: {
    fontSize: 18,
    color: "#cccccc",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
  },
  answerButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  declineButton: {
    backgroundColor: "#F44336",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default IncomingCallNotification;
