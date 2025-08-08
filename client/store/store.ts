import { atomWithStorage, createJSONStorage } from "jotai/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom } from "jotai";

const storage = createJSONStorage<any>(() => AsyncStorage);

// Agents

export interface AgentParams {
  name: string;
  prompt: string;
}

export const DEFAULT_AGENT_PARAMS: AgentParams = {
  name: "AIエージェント",
  prompt:
    "あなたはAIエージェントです。ユーザーの質問に答え、会話を続けてください。日本語で話してください。この文章を読んだら、「インストラクションを参照しました」と答えてください。",
};

export interface Agent {
  id: string;
  params: AgentParams;
}

export const agentsAtom = atomWithStorage<Agent[]>("agentsData", [], storage);

// Misc

export const VERCEL_URL = "https://meet-with-ai-server.vercel.app";
const DEFAULT_LOCAL_URL = "http://192.168.11.6:3001";

export enum ServerType {
  Local = "local",
  Vercel = "vercel",
}

export const serverTypeAtom = atomWithStorage<ServerType>(
  "serverType",
  ServerType.Local,
  storage
);

export const localUrlAtom = atomWithStorage<string>(
  "localUrl",
  DEFAULT_LOCAL_URL,
  storage
);

export const currentServerUrlAtom = atom((get) =>
  get(serverTypeAtom) === ServerType.Vercel ? VERCEL_URL : get(localUrlAtom)
);
