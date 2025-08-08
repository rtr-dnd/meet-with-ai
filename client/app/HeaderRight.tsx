import { useAtomValue } from "jotai";
import ServerSettingsModal from "./ServerSettingsModal";
import { currentServerUrlAtom } from "@/store/store";
import { useState } from "react";
import { Alert } from "react-native";
import { MenuView, NativeActionEvent } from "@react-native-menu/menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "@/lib/icons/EllipsisVertical";

const HeaderRight = ({ clearAgents }: { clearAgents: () => void }) => {
  const [showServerSettings, setShowServerSettings] = useState<boolean>(false);

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

  const menuAction = ({ nativeEvent }: NativeActionEvent) => {
    switch (nativeEvent.event) {
      case "test":
        testServerConnection();
        break;
      case "setting":
        setShowServerSettings(true);
        break;
      case "clear":
        clearAgents();
        break;
    }
  };

  return (
    <>
      <MenuView
        isAnchoredToRight
        actions={[
          {
            id: "test",
            title: "接続テスト",
          },
          {
            id: "setting",
            title: "サーバ設定",
          },
          {
            id: "clear",
            title: "データをクリア",
            attributes: {
              destructive: true,
            },
          },
        ]}
        onPressAction={menuAction}
      >
        <Button size="icon">
          <EllipsisVertical className="size-4 text-primary-foreground" />
        </Button>
      </MenuView>
      <ServerSettingsModal
        visible={showServerSettings}
        close={() => setShowServerSettings(false)}
      />
    </>
  );
};

export default HeaderRight;
