import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Meet with AI Server!' });
});

// Session creation endpoint
interface SessionRequest {
  instructions?: string;
  agentName?: string;
}

app.post('/api/session', async (req: Request<{}, {}, SessionRequest>, res: Response): Promise<void> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'OpenAI API key not configured' });
      return;
    }

    const { instructions, agentName } = req.body;
    const defaultAgentName = "AIエージェント";
    const defaultPrompt = "ユーザーの質問に答え、会話を続けてください。日本語で話してください。";
    
    const finalAgentName = agentName || defaultAgentName;
    const finalPrompt = instructions || defaultPrompt;
    const formattedInstructions = `あなたは${finalAgentName}という名前のAIエージェントです。以下の指示に従ってください。${finalPrompt}`;

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        instructions: formattedInstructions,
        voice: "verse",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Session created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3001;

// 開発環境でのみlisten、Vercelでは自動的に処理される
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;