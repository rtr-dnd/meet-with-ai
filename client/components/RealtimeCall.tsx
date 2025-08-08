import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";

interface RealtimeCallProps {
  onClose: () => void;
  prompt?: string;
  agentName?: string;
  serverUrl?: string;
}

const RealtimeCall: React.FC<RealtimeCallProps> = ({
  onClose,
  prompt,
  agentName,
  serverUrl,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createSession = async () => {
    try {
      const url =
        serverUrl ||
        process.env.EXPO_PUBLIC_SERVER_URL ||
        "http://localhost:3001";
      const response = await fetch(`${url}/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructions: prompt,
          agentName: agentName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Session creation failed:", error);
      throw error;
    }
  };

  const startCall = useCallback(async () => {
    try {
      setConnectionStatus("connecting");

      // セッション作成
      const sessionData = await createSession();
      console.log("Session created:", sessionData);

      // WebRTC PeerConnection 作成
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // データチャンネル作成
      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        console.log("Data channel opened");
        setIsConnected(true);
        setConnectionStatus("connected");
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);

          if (data.type === "session.created") {
            setIsSessionActive(true);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });

      // マイクアクセス
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;

        // 音声トラックを追加
        stream.getAudioTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        setIsListening(true);
      } catch (error) {
        console.error("Microphone access failed:", error);
        Alert.alert("エラー", "マイクへのアクセスが許可されていません");
      }

      // SDP Offer 作成
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // OpenAI Realtime API WebRTCエンドポイントに接続
      console.log("Connecting to OpenAI WebRTC endpoint");
      console.log("Session ID:", sessionData.id);
      console.log("SDP Offer:", offer.sdp);

      const realtimeResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            "Content-Type": "application/sdp",
            Authorization: `Bearer ${sessionData.client_secret.value}`,
          },
        }
      );

      if (!realtimeResponse.ok) {
        console.error(realtimeResponse);
        throw new Error("Failed to connect to OpenAI Realtime API");
      }

      const answerSDP = await realtimeResponse.text();
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answerSDP,
        })
      );

      console.log("WebRTC connection established");
    } catch (error) {
      console.error("Failed to start call:", error);
      setConnectionStatus("error");
      Alert.alert("接続エラー", "通話の開始に失敗しました");
    }
  }, []);

  const endCall = useCallback(() => {
    try {
      // データチャンネルを閉じる
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      // PeerConnection を閉じる
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // ローカルストリームを停止
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // InCallManager cleanup
      InCallManager.stop();

      setIsConnected(false);
      setIsSessionActive(false);
      setIsListening(false);
      setConnectionStatus("disconnected");

      onClose();
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, [onClose]);

  useEffect(() => {
    InCallManager.start({ media: "audio", auto: false, ringback: false });
    InCallManager.setKeepScreenOn(true);
    InCallManager.setForceSpeakerphoneOn(isSpeakerOn);

    startCall();

    return () => {
      InCallManager.stop();
      endCall();
    };
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsListening(audioTrack.enabled);
      }
    }
  }, []);

  const toggleSpeaker = useCallback(async () => {
    try {
      const newSpeakerState = !isSpeakerOn;

      if (newSpeakerState) {
        // Switch to speakerphone
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
        console.log("Audio switched to Speaker");
      } else {
        // Switch to earpiece
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.setSpeakerphoneOn(false);
        console.log("Audio switched to Earpiece");
      }

      setIsSpeakerOn(newSpeakerState);
    } catch (error) {
      console.log("Error switching audio output:", error);
    }
  }, [isSpeakerOn]);

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "接続中...";
      case "connected":
        return isSessionActive ? "AIと通話中" : "接続済み";
      case "error":
        return "接続エラー";
      default:
        return "未接続";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{agentName || "AIエージェント"}</Text>
      <Text style={styles.subtitle}>AI Realtime 通話</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isConnected ? "#4CAF50" : "#F44336" },
          ]}
        />
      </View>

      {isConnected && (
        <View style={styles.callControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isListening ? "#4CAF50" : "#F44336" },
            ]}
            onPress={toggleMicrophone}
          >
            <Text style={styles.controlButtonText}>
              {isListening ? "🎤" : "🔇"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isSpeakerOn ? "#2196F3" : "#999" },
            ]}
            onPress={toggleSpeaker}
          >
            <Text style={styles.controlButtonText}>スピーカーホン</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endButton} onPress={endCall}>
            <Text style={styles.endButtonText}>📞</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  statusText: {
    fontSize: 16,
    marginRight: 10,
    color: "#666",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  callControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonText: {
    fontSize: 24,
  },
  endButton: {
    backgroundColor: "#F44336",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  endButtonText: {
    fontSize: 24,
  },
});

export default RealtimeCall;
