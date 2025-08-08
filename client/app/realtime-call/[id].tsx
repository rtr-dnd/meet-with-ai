import RealtimeCall from "@/components/RealtimeCall";
import { agentsAtom, currentServerUrlAtom } from "@/store/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";

const RealtimeCallPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const agents = useAtomValue(agentsAtom);
  const agent = agents.find((e) => e.id === id);

  const currentServerUrl = useAtomValue(currentServerUrlAtom);

  return (
    <>
      <Stack.Screen />
      <RealtimeCall
        onClose={() => router.dismissTo("/")}
        prompt={agent?.params.prompt}
        agentName={agent?.params.name}
        serverUrl={currentServerUrl}
      />
    </>
  );
};

export default RealtimeCallPage;
