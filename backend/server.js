// backend/server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 5001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// OpenAI 클라이언트 초기화
const apiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OpenAI API 키가 설정되지 않았습니다!');
  console.error('📝 .env 파일에 OPENAI_API_KEY=your-key-here 를 추가해주세요');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey
});

// 챗 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agent, history = [] } = req.body;

    const conversationHistory = history.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content
    }));
    
    // 에이전트별 시스템 메시지
    const systemMessages = {
      chat: "You are a helpful AI assistant. Respond in Korean.",
      onboarder: "You are an API integration specialist. Help users understand and integrate various APIs. Respond in Korean.",
      infoviz: "You are a data visualization expert. Help users create charts and infographics from data. Respond in Korean."
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemMessages[agent] || systemMessages.chat 
        },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({ 
      response: completion.choices[0].message.content,
      agent: agent
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'API 호출 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 서버 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat`);
  console.log(`   - GET  http://localhost:${PORT}/api/status`);
});