import "react-native-get-random-values";
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  AppRegistry,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import IncomingCallNotification from "@/components/IncomingCallNotification";
import { Stack, useRouter } from "expo-router";
import { v4 as uuidv4 } from "uuid";
import { useAtom, useAtomValue } from "jotai";
import {
  AgentParams,
  agentsAtom,
  currentServerUrlAtom,
  DEFAULT_AGENT_PARAMS,
  localUrlAtom,
  ServerType,
  serverTypeAtom,
  VERCEL_URL,
} from "@/store/store";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from "react-native-popup-menu";

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

  const updateAgent = async (id: string, fragment: Partial<AgentParams>) => {
    const updatedAgents = agents.map((agent) =>
      agent.id === id
        ? { ...agent, params: { ...agent.params, ...fragment } }
        : agent
    );
    await setAgents(updatedAgents);
  };

  const [serverType, setServerType] = useAtom(serverTypeAtom);
  const [localUrl, setLocalUrl] = useAtom(localUrlAtom);
  const currentServerUrl = useAtomValue(currentServerUrlAtom);
  const [showServerSettings, setShowServerSettings] = useState<boolean>(false);

  const testServerConnection = async () => {
    try {
      const response = await fetch(`${currentServerUrl}/api/test`);
      const data = await response.json();
      Alert.alert(
        "サーバテスト",
        `${data.message}\n\nURL: ${currentServerUrl}`
      );
    } catch (error) {
      Alert.alert(
        "エラー",
        `サーバに接続できませんでした\n\nURL: ${currentServerUrl}`
      );
    }
  };
  return (
    <MenuProvider>
      <Stack.Screen
        options={{
          title: "Meet with AI",
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={testServerConnection}>
                <MaterialIcons name="warning" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowServerSettings(true)}>
                <MaterialIcons name="cloud-queue" size={24} color="#000" />
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
              <Menu>
                <MenuTrigger
                  customStyles={{
                    triggerWrapper: styles.menuButton,
                  }}
                >
                  <MaterialIcons name="more-vert" size={24} color="#666" />
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: styles.menuOptions,
                  }}
                >
                  <MenuOption
                    onSelect={() => {
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
                    }}
                  >
                    <Text style={styles.menuOptionText}>削除</Text>
                  </MenuOption>
                </MenuOptions>
              </Menu>
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
          <MaterialIcons name="add" size={24} color="#fff" style={styles.createIcon} />
          <Text style={styles.createButtonText}>
            新しいエージェントを作成
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showServerSettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowServerSettings(false)}
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
              <TouchableOpacity
                style={styles.dialogButton}
                onPress={() => setShowServerSettings(false)}
              >
                <Text style={styles.dialogButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MenuProvider>
  );
};

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
