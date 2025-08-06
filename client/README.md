# Meet with AI Client

AIと定期ミーティングができるモバイルアプリです。WebSocketを使用してOpenAI Realtime APIと直接通信し、リアルタイムでAIと会話できます。

## 現在の実装状況

### 実装済み機能
- **WebSocket通信**: OpenAI Realtime APIとの直接接続
- **リアルタイム会話**: AIとのテキスト・音声によるリアルタイム通信
- **サーバ連携**: 基本的なHTTP APIテスト機能

### 画面構成
- **メイン画面**: サーバテスト、チャット、Realtime通話機能
- **WebSocket Realtime画面**: OpenAI Realtime APIとの通信インターフェイス

## 開発環境

### 前提条件
- Node.js
- Expo CLI
- OpenAI API Key

### セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数設定
`.env`ファイルを作成し、OpenAI API Keyを設定:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

3. サーバ起動
```bash
cd ../server
npm run dev
```

4. クライアント起動
```bash
npx expo start
```

## 技術スタック

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Routing**: Expo Router
- **リアルタイム通信**: WebSocket
- **AI API**: OpenAI Realtime API

## プロジェクト構成

```
app/
├── _layout.tsx                    # ルートレイアウト
└── index.tsx                      # メイン画面
components/
└── WebSocketRealtimeCall.tsx      # WebSocket Realtime通話コンポーネント
```

## 今後の実装予定

- 音声録音・再生機能
- 複数エージェント対応
- チャット履歴管理
- 日程調整機能

## 長期ビジョン

AIと定期ミーティングをセットし、自分の意識ポートフォリオの一部を外部に任せるアプリ。

### 目指す機能
- **複数のAIエージェント**: 家計、健康、恋愛など専門分野別の相談役
- **チャット機能**: WhatsAppのようなインターフェイスでやり取り
- **定期ミーティング**: 各エージェントとの音声通話
- **日程調整**: AIとの通話スケジュールを自動管理
- **履歴管理**: チャットと通話の履歴を各ルーム別に保存