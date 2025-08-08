import IncomingCallNotification from "@/components/IncomingCallNotification";
import { agentsAtom } from "@/store/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";

const IncomingCallPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const agents = useAtomValue(agentsAtom);
  const agent = agents.find((e) => e.id === id);

  return (
    <>
      <Stack.Screen />
      <IncomingCallNotification
        onAnswer={() => {
          router.replace({
            pathname: "/realtime-call/[id]",
            params: { id: id as string },
          });
        }}
        onDecline={() => {
          router.back();
        }}
        callerName={agent?.params.name}
      />
    </>
  );
};

export default IncomingCallPage;
