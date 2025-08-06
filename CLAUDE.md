# Meet with AI - 実装方針

## プロジェクト概要
AIエージェントと定期ミーティングができるモバイルアプリケーション。ユーザーは複数の専門分野（家計、健康、恋愛等）のAIエージェントとチャット・音声通話でやり取りし、思考を整理できる。

## 技術スタック

### Client (React Native + Expo)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router (ファイルベースルーティング)
- **UI**: React Native標準コンポーネント
- **通信**: fetch API (HTTP), 将来的にSocket.IO Client

### Server (Node.js)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO (WebRTCシグナリング準備)
- **Language**: JavaScript
- **CORS**: cors middleware

## 現在の実装状況

### Server側 (`/server`)
```
server/
├── package.json          # Express, Socket.IO, cors, dotenv, openai
├── .env                  # OpenAI API Key設定
├── src/
│   └── index.js          # Express + Socket.IO + OpenAI Realtime API統合
```

**依存関係**:
- express: ^4.18.2
- socket.io: ^4.7.4  
- cors: ^2.8.5
- openai: ^5.11.0
- dotenv: ^17.2.1

**実装済みAPI**:
- `GET /api/test` - 接続テスト用エンドポイント
- `POST /api/chat` - チャットメッセージ受信・テストレスポンス返却（OpenAI未使用）
- `POST /api/session` - OpenAI Realtime APIセッション作成（WebRTC対応）
- Socket.IO接続対応（基本的な接続・切断ログのみ）

**サーバ起動**: 
```bash
cd server && npm run dev  # nodemon使用
```

### Client側 (`/client`)
```
client/
├── app/
│   ├── _layout.tsx       # ルートレイアウト（expo-router）
│   └── index.tsx         # メイン画面（3つのボタン + Realtime通話モーダル）
├── components/
│   └── RealtimeCall.tsx  # AI Realtime通話コンポーネント（WebRTC対応）
├── constants/
│   └── Colors.ts
├── hooks/                # カラーテーマ関連
├── assets/              # 画像・フォント
```

**依存関係**:
- expo: ~53.0.20
- react-native: 0.79.5
- expo-router: ~5.1.4
- react-native-webrtc: ^124.0.6
- react-native-webview: 13.13.5
- expo-dev-client: ~5.2.4

**実装済み機能**:
- サーバ接続テスト ボタン (`GET /api/test`)
- AIメッセージ送信 ボタン (`POST /api/chat`)
- **AI Realtime通話機能**: OpenAI Realtime API + WebRTC統合
  - マイク音声の取得・送信
  - セッション管理とWebRTC接続
  - 通話開始・終了・マイクON/OFF制御
- **RealtimeCallコンポーネント**: フルスクリーンモーダル対応

**未実装機能**:
- WebSocket通信（将来的なリアルタイム機能拡張用）
- チャット履歴の永続化
- 複数AIエージェントの切り替え

**クライアント起動**:
```bash
cd client && npx expo start
```

## ネットワーク設定
- **開発環境**: サーバは `http://192.168.11.4:3000` で起動
- Android端末からローカルIPアドレス経由でアクセス可能

## 今後の実装予定

### 短期目標
1. **音声応答の再生**: AIからの音声レスポンスをスピーカーで再生
2. **複数エージェント**: トークルーム別の専門AIエージェント（家計、健康、恋愛等）
3. **チャット履歴**: 永続化とコンテキスト保持
4. **通話履歴**: 録音・要約機能

### 中期目標
1. **日程調整**: Googleカレンダー連携
2. **プッシュ通知**: 定期ミーティング通知
3. **エージェントカスタマイズ**: ユーザー独自エージェント作成

### 長期目標
1. **マルチプラットフォーム**: iOS対応
2. **バックエンド**: データベース導入 (ユーザー管理)
3. **AI機能拡張**: ファイル共有、画像解析等

## 開発コマンド

### Lint/Typecheck
```bash
# Client
cd client && npm run lint

# Server (将来的にTypeScript移行時)
cd server && npm run lint
```

### テスト手順
1. サーバ起動: `cd server && npm run dev`
2. クライアント起動: `cd client && npx expo start`
3. Android端末でテストボタン操作
4. サーバログで通信確認

## 設計思想
- **プロトタイプ優先**: 軽量で動作確認しやすい構成
- **段階的実装**: HTTP → WebSocket → 音声機能 の順で機能拡張
- **Expo Go対応**: WebRTCではなくWebSocketベースで実装