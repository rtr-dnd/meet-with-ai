import { currentServerUrlAtom } from "@/store/store";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useAtomValue } from "jotai";
import { Alert, TouchableOpacity } from "react-native";

const TestConnectionButton = () => {
  const currentServerUrl = useAtomValue(currentServerUrlAtom);

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
    <TouchableOpacity onPress={testServerConnection}>
      <MaterialIcons name="warning" size={24} color="#000" />
    </TouchableOpacity>
  );
};

export default TestConnectionButton;
