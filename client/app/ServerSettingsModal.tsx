import {
  localUrlAtom,
  ServerType,
  serverTypeAtom,
  VERCEL_URL,
} from "@/store/store";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useAtom } from "jotai";
import { useState } from "react";
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  View,
  Text,
  TextInput,
} from "react-native";

const ServerSettingsModal = ({
  visible,
  close,
}: {
  visible: boolean;
  close: () => void;
}) => {
  const [serverType, setServerType] = useAtom(serverTypeAtom);
  const [localUrl, setLocalUrl] = useAtom(localUrlAtom);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={close}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <Text style={styles.dialogTitle}>サーバー設定</Text>

          <View style={styles.dialogContent}>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setServerType(ServerType.Local)}
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
                onPress={() => setServerType(ServerType.Vercel)}
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
                onChangeText={setLocalUrl}
                placeholder="ローカルサーバーURL..."
                style={styles.dialogInput}
              />
            )}
            {serverType === ServerType.Vercel && (
              <Text style={styles.urlDisplay}>{VERCEL_URL}</Text>
            )}
          </View>

          <View style={styles.dialogButtons}>
            <TouchableOpacity style={styles.dialogButton} onPress={close}>
              <Text style={styles.dialogButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ServerSettingsModal;

const styles = StyleSheet.create({
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
    borderRadius: 8,
    minWidth: 280,
    maxWidth: "100%",
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    padding: 24,
    paddingBottom: 16,
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },
  dialogButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
    textTransform: "uppercase",
  },
  // Radio button styles
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
});
