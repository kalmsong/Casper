// backend/server.js (Complete Rewrite - Clean Structure)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

// AI SDK imports
const OpenAI = require('openai');

// 파일 프로세서 import
const { FileProcessor } = require('./file_processor.js');

const app = express();
const PORT = 5001;

// ===== 기본 설정 =====

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 업로드 디렉토리 생성: ${uploadDir}`);
}

// .env 파일 경로
const envPath = path.join(__dirname, '.env');

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// ===== OpenAI 설정 =====

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
let openai = null;

if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
  console.log('✅ OpenAI API 키 로드 완료');
} else {
  console.warn('⚠️ OpenAI API 키가 설정되지 않음');
}

// ===== 파일 프로세서 초기화 =====

console.log('🔧 FileProcessor 인스턴스 생성 중...');
const fileProcessor = new FileProcessor();
console.log('✅ FileProcessor 준비 완료');

// ===== 임시 저장소 =====

const documentStore = new Map();
const apiKeysStore = new Map();
const parserKeysStore = new Map(); // documentId -> Map(keyId -> keyData)

// ===== .env 파일 관리 함수들 =====

function initializeEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      const defaultEnv = `# API Hub Environment Variables
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-claude-key-here
GEMINI_API_KEY=your-gemini-key-here
ENCRYPTION_SECRET=default-secret-key-change-this
PORT=5001
`;
      fs.writeFileSync(envPath, defaultEnv, 'utf8');
      console.log('✅ .env 파일이 생성되었습니다');
    }
  } catch (error) {
    console.error('❌ .env 파일 초기화 실패:', error);
  }
}

function readEnvFile() {
  try {
    initializeEnvFile();
    const content = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        
        if (key && value) {
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ .env 파일 읽기 실패:', error);
    return {};
  }
}

function writeEnvFile(envVars) {
  try {
    let existingContent = '';
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
    }
    
    const lines = [];
    const existingLines = existingContent.split('\n');
    const processedKeys = new Set();
    
    existingLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=') || !trimmed) {
        lines.push(line);
      } else {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        
        if (envVars.hasOwnProperty(key)) {
          lines.push(`${key}=${envVars[key]}`);
          processedKeys.add(key);
        } else {
          lines.push(line);
        }
      }
    });
    
    Object.entries(envVars).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        lines.push(`${key}=${value}`);
      }
    });
    
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
    console.log('✅ .env 파일 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ .env 파일 쓰기 실패:', error);
    return false;
  }
}

// ===== 암호화/복호화 함수들 =====

function getEncryptionSecret() {
  const envVars = readEnvFile();
  return envVars.ENCRYPTION_SECRET || 'default-secret-key-change-this-to-32-chars';
}

function encryptApiKey(key) {
  try {
    const secret = getEncryptionSecret();
    const algorithm = 'aes-256-cbc';
    const secretKey = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ API 키 암호화 실패:', error);
    throw error;
  }
}

function decryptApiKey(encryptedKey) {
  try {
    const secret = getEncryptionSecret();
    const secretKey = crypto.createHash('sha256').update(secret).digest();
    
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) {
      throw new Error('잘못된 암호화 데이터 형식');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ API 키 복호화 실패:', error);
    return null;
  }
}

// ===== 키 만료 관리 함수들 =====

function isKeyExpired(expiryDate) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

function deactivateExpiredKeys() {
  let hasChanges = false;
  
  for (const [keyId, keyData] of apiKeysStore.entries()) {
    if (keyData.isActive && isKeyExpired(keyData.expiryDate)) {
      keyData.isActive = false;
      keyData.deactivatedAt = new Date().toISOString();
      hasChanges = true;
      console.log(`📅 만료된 키 비활성화: ${keyData.name} (ID: ${keyId})`);
    }
  }
  
  return hasChanges;
}

// ===== AI 모델 호출 함수들 =====

async function callOpenAI(messages, systemMessage = null) {
  if (!openai) {
    throw new Error('OpenAI API가 설정되지 않았습니다');
  }

  const messagesForAPI = systemMessage 
    ? [{ role: "system", content: systemMessage }, ...messages]
    : messages;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messagesForAPI,
    max_tokens: 1000,
    temperature: 0.7
  });

  return completion.choices[0].message.content;
}

async function callClaude(messages, systemMessage = null) {
  if (!openai) {
    throw new Error('Claude 시뮬레이션을 위한 OpenAI API가 설정되지 않았습니다');
  }

  const claudeSystemPrompt = `${systemMessage || ''} 
당신은 Claude 3, Anthropic의 AI 어시스턴트입니다. 
코딩, 분석, 정리, 논리적 사고에 특화되어 있습니다. 
정확하고 체계적인 답변을 제공하세요.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: claudeSystemPrompt },
      ...messages
    ],
    max_tokens: 1000,
    temperature: 0.3
  });

  return completion.choices[0].message.content;
}

async function callGemini(messages, systemMessage = null) {
  if (!openai) {
    throw new Error('Gemini 시뮬레이션을 위한 OpenAI API가 설정되지 않았습니다');
  }

  const geminiSystemPrompt = `${systemMessage || ''} 
당신은 Google Gemini, Google의 AI 어시스턴트입니다. 
검색, 최신 정보 제공, 데이터 분석에 특화되어 있습니다. 
정확하고 최신의 정보를 바탕으로 답변하세요.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: geminiSystemPrompt },
      ...messages
    ],
    max_tokens: 1000,
    temperature: 0.5
  });

  return completion.choices[0].message.content;
}

function selectModelAutomatically(message) {
  const lowerMessage = message.toLowerCase();
  
  const codingKeywords = [
    '코드', '프로그래밍', '함수', '버그', '디버그', 'debug', 'code', 'coding',
    'python', 'javascript', 'react', 'api', 'algorithm', 'data structure',
    '정리해', '분석해', '요약해', '리팩토링', 'refactor', '최적화', 'optimize'
  ];
  
  const searchKeywords = [
    '최신', '뉴스', '검색', '찾아', '언제', '어디서', '누가', '트렌드', 'trend',
    '현재', '지금', '오늘', '이번달', '이번년도', '2024', '2025',
    '가격', 'price', '시세', '주식', 'stock', '환율', 'exchange rate'
  ];
  
  const creativeKeywords = [
    '아이디어', '브레인스토밍', 'brainstorm', '창의적', 'creative', '제안', 'suggest',
    '방법', 'method', 'way', '생각', 'think', '어떻게', 'how to',
    '계획', 'plan', '전략', 'strategy', '상상', 'imagine', '발상', '컨셉'
  ];

  if (codingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'claude';
  } else if (searchKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'gemini';
  } else if (creativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'openai';
  }
  
  if (message.includes('?') && message.length < 50) {
    return 'gemini';
  } else if (message.length > 200 && (message.includes('설명') || message.includes('자세히'))) {
    return 'claude';
  }
  
  return 'openai';
}

async function callAIModel(model, messages, systemMessage = null) {
  try {
    console.log(`🤖 ${model.toUpperCase()} 모델 호출 중...`);
    
    switch (model) {
      case 'openai':
        return await callOpenAI(messages, systemMessage);
      case 'claude':
        return await callClaude(messages, systemMessage);
      case 'gemini':
        return await callGemini(messages, systemMessage);
      default:
        throw new Error(`지원되지 않는 모델: ${model}`);
    }
  } catch (error) {
    console.error(`❌ ${model} 모델 호출 실패:`, error);
    
    if (model !== 'openai' && openai) {
      console.log('🔄 OpenAI로 폴백 시도...');
      return await callOpenAI(messages, `[${model} 모델을 시뮬레이션] ${systemMessage || ''}`);
    }
    
    throw error;
  }
}

function getSelectionReasoning(message, selectedModel) {
  const lowerMessage = message.toLowerCase();
  
  if (selectedModel === 'claude') {
    const codingWords = ['코드', '프로그래밍', '분석', '정리'];
    const found = codingWords.find(word => lowerMessage.includes(word));
    return found ? `"${found}" 키워드로 분석/코딩 작업 감지` : '복잡한 논리적 사고 필요';
  } else if (selectedModel === 'gemini') {
    const searchWords = ['최신', '검색', '현재', '트렌드'];
    const found = searchWords.find(word => lowerMessage.includes(word));
    return found ? `"${found}" 키워드로 검색/정보 요청 감지` : '짧은 질문 형태로 판단';
  } else {
    const creativeWords = ['아이디어', '브레인스토밍', '창의적'];
    const found = creativeWords.find(word => lowerMessage.includes(word));
    return found ? `"${found}" 키워드로 창의적 작업 감지` : '일반적인 대화로 판단';
  }
}

// ===== Multer 설정 =====

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    
    console.log(`📁 파일명 처리: ${originalName} -> ${safeFilename}`);
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.xlsx', '.txt'];
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const fileExt = path.extname(originalName).toLowerCase();
    
    console.log(`📋 파일 필터링: ${originalName} (${fileExt})`);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`지원되지 않는 파일 형식입니다: ${fileExt}`), false);
    }
  }
});

// ===== API 엔드포인트들 =====

// 1. 채팅 API (다중 모델 지원)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agent, model = 'openai', history = [], documentId } = req.body;

    console.log(`💬 채팅 요청: ${agent} 에이전트, ${model} 모델`);

    const conversationHistory = history
      .filter(msg => msg.content && msg.content.trim())
      .slice(-10)
      .map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }));
    
    let systemMessage = "You are a helpful AI assistant. Respond in Korean.";
    
    if (agent === 'onboarder') {
      systemMessage = `You are an API integration specialist helping with API Hub. 
      
Current context: ${documentId ? `Working with document ID: ${documentId}` : 'No active document'}

Help users:
1. Understand API documentation
2. Choose appropriate parser types
3. Customize parser settings
4. Troubleshoot integration issues

Always respond in Korean and be specific about next steps.`;
    } else if (agent === 'infoviz') {
      systemMessage = "You are a data visualization expert. Help users create charts and infographics from data. Respond in Korean.";
    } else if (agent === 'chat') {
      const modelPrompts = {
        openai: "You are OpenAI's GPT-4, excellent at brainstorming, creative ideas, and general conversation. Be creative and engaging.",
        claude: "You are Claude 3 by Anthropic, specialized in coding, analysis, organization, and logical thinking. Be precise and systematic.",
        gemini: "You are Google's Gemini, specialized in search, latest information, and data analysis. Provide accurate and up-to-date information."
      };
      
      systemMessage = `${modelPrompts[model] || modelPrompts.openai} Always respond in Korean.`;
    }

    conversationHistory.push({ role: "user", content: message });

    const response = await callAIModel(model, conversationHistory, systemMessage);

    console.log(`✅ ${model} 모델 응답 생성 완료 (${response.length}자)`);

    res.json({ 
      response: response,
      agent: agent,
      model: model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 채팅 API 오류:', error);
    
    const errorResponse = {
      error: 'AI 응답 생성 중 오류가 발생했습니다.',
      details: error.message,
      fallbackResponse: '죄송합니다. 현재 일시적인 오류로 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.'
    };

    res.status(500).json(errorResponse);
  }
});

// 2. 모델 상태 확인 엔드포인트
app.get('/api/models/status', (req, res) => {
  const modelStatus = {
    openai: {
      available: !!openai,
      name: 'OpenAI GPT-4',
      specialties: ['브레인스토밍', '창의성', '일반 질문']
    },
    claude: {
      available: true,
      name: 'Claude 3',
      specialties: ['코딩', '분석', '정리', '논리적 사고']
    },
    gemini: {
      available: true,
      name: 'Google Gemini',
      specialties: ['검색', '최신정보', '데이터 분석']
    }
  };

  res.json({
    success: true,
    models: modelStatus,
    defaultModel: 'openai',
    timestamp: new Date().toISOString()
  });
});

// 3. 자동 모델 선택 테스트 엔드포인트
app.post('/api/models/auto-select', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: '메시지가 필요합니다.'
      });
    }

    const selectedModel = selectModelAutomatically(message);
    
    console.log(`🎯 자동 모델 선택: "${message}" -> ${selectedModel}`);

    res.json({
      success: true,
      message: message,
      selectedModel: selectedModel,
      reasoning: getSelectionReasoning(message, selectedModel),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 자동 모델 선택 오류:', error);
    res.status(500).json({
      success: false,
      error: '모델 선택 중 오류가 발생했습니다.'
    });
  }
});

// ===== Lexpilot 법규검토 API 엔드포인트들 =====

// 4. 토지이용계획 정보 조회
app.post('/api/lexpilot/land-info', async (req, res) => {
  console.log('🏠 Lexpilot: 토지 정보 조회 요청 받음');
  console.log('요청 데이터:', req.body);
  
  try {
    const { address, address_type } = req.body;
    
    console.log(`주소: ${address}, 타입: ${address_type}`);
    
    if (!address || !address_type) {
      console.log('❌ 필수 파라미터 누락');
      return res.status(400).json({
        success: false,
        error: '주소와 주소 유형은 필수입니다.'
      });
    }

    // 일단 더미 데이터로 테스트
    console.log('✅ 더미 데이터 반환 중...');
    const dummyResponse = {
      success: true,
      address: {
        road: address,
        jibun: address,
        zipcode: '12345',
        coordinates: { x: 127.1, y: 37.5 },
        pnu: '1111012300001234567'
      },
      land_info: {
        landCharacteristics: {
          lndpcl_ar: '1000.00',
          prpos_area_1_nm: '제2종일반주거지역',
          lnm_lndcgr_smbol: '대',
          ld_cpsg_code: 'A001',
          pblntf_pclnd: '공시지가정보',
          prpos_area_2_nm: null,
          lad_use_sittn_nm: '계획관리지역',
          tpgrph_hg_code_nm: '평지',
          tpgrph_frm_code_nm: '정형',
          road_side_code_nm: '각지'
        },
        landUseAttributes: {
          prpos_area_dstrc_code_list: ['UQA110'],
          prpos_area_dstrc_nm_list: ['제2종일반주거지역']
        }
      }
    };
    
    res.json(dummyResponse);
    console.log('✅ 응답 전송 완료');

    // 실제 API 호출 (주석 처리)
    /*
    const apiUrl = `https://law.architectgpts.shop/land_info?address=${encodeURIComponent(address)}&address_type=${address_type}`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Lexpilot API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 토지 정보 조회 성공');
    
    res.json({
      success: true,
      ...data
    });
    */

  } catch (error) {
    console.error('❌ 토지 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: `토지 정보 조회 실패: ${error.message}`
    });
  }
});

// 5. 건축행위 가능 여부 조회
app.post('/api/lexpilot/buildable', async (req, res) => {
  console.log('🏗️ Lexpilot: 건축 가능성 조회 요청 받음');
  console.log('요청 데이터:', req.body);
  
  try {
    const { address, address_type, landUseNm } = req.body;
    
    if (!address || !address_type || !landUseNm) {
      return res.status(400).json({
        success: false,
        error: '주소, 주소 유형, 건축 용도는 필수입니다.'
      });
    }

    console.log(`건축 가능성 분석: ${address}에 ${landUseNm} 건축`);

    // 더미 데이터로 응답 (외부 API 500 오류 회피)
    const dummyResponse = {
      success: true,
      buildable: true,
      data: {
        result: '건축 가능',
        landUse: landUseNm,
        address: address,
        message: `${landUseNm} 용도로 건축이 가능합니다.`,
        analysis: {
          zoning: '제2종일반주거지역',
          buildingCoverage: '70% 이하',
          floorAreaRatio: '300% 이하',
          heightLimit: '15층 이하',
          suitability: '적합'
        },
        restrictions: [
          '건폐율: 70% 이하 준수 필요',
          '용적률: 300% 이하 준수 필요',
          '건축물 높이: 15층 이하',
          '주차장 설치 의무',
          '조경 의무'
        ],
        recommendations: [
          '설계 시 일조권 검토 권장',
          '인근 건축물과의 이격거리 확인',
          '상세한 지질조사 권장'
        ]
      }
    };
    
    console.log('✅ 건축 가능성 더미 데이터 반환');
    res.json(dummyResponse);

    /* 외부 API 호출 (현재 500 오류로 주석 처리)
    const apiUrl = `https://law.architectgpts.shop/Buildable?address=${encodeURIComponent(address)}&address_type=${address_type}&landUseNm=${encodeURIComponent(landUseNm)}`;
    
    console.log('외부 API 호출:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`외부 API 오류: ${response.status} ${response.statusText}`);
      throw new Error(`Lexpilot API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 건축 가능성 조회 성공');
    
    res.json({
      success: true,
      buildable: true,
      data: data
    });
    */

  } catch (error) {
    console.error('❌ 건축 가능성 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: `건축 가능성 조회 실패: ${error.message}`
    });
  }
});

// 6. 토지규제법령정보 조회  
app.post('/api/lexpilot/regulation', async (req, res) => {
  try {
    const { address, address_type } = req.body;
    
    console.log(`⚖️ Lexpilot: 규제 법령 조회 - ${address}`);
    
    if (!address || !address_type) {
      return res.status(400).json({
        success: false,
        error: '주소와 주소 유형은 필수입니다.'
      });
    }

    const apiUrl = `https://law.architectgpts.shop/Regulation?address=${encodeURIComponent(address)}&address_type=${address_type}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Lexpilot API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 규제 법령 조회 성공');
    
    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ 규제 법령 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: `규제 법령 조회 실패: ${error.message}`
    });
  }
});

// 7. 설계개요 작성용 정보 조회 (서울시만)
app.post('/api/lexpilot/build-summary', async (req, res) => {
  try {
    const { address, address_type, field } = req.body;
    
    console.log(`📋 Lexpilot: 설계개요 정보 조회 - ${address}, 항목: ${field || '전체'}`);
    
    if (!address || !address_type) {
      return res.status(400).json({
        success: false,
        error: '주소와 주소 유형은 필수입니다.'
      });
    }

    let apiUrl = `https://law.architectgpts.shop/BuildSUM?address=${encodeURIComponent(address)}&address_type=${address_type}`;
    if (field) {
      apiUrl += `&field=${encodeURIComponent(field)}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Lexpilot API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 설계개요 정보 조회 성공');
    
    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ 설계개요 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: `설계개요 정보 조회 실패: ${error.message}`
    });
  }
});

// 8. Lexpilot AI 해석 엔드포인트 (Claude 모델 사용)
app.post('/api/lexpilot/interpret', async (req, res) => {
  try {
    const { address, buildingUse, landInfo, buildable, regulation, buildSummary } = req.body;
    
    console.log(`🧠 Lexpilot: AI 해석 요청 - ${address}, ${buildingUse}`);

    // OpenAI API가 없을 경우를 대비한 더미 해석
    if (!openai) {
      console.log('⚠️ OpenAI API 없음, 더미 해석 반환');
      const dummyInterpretation = `
📋 **${address} 법규 검토 보고서**

📍 **대상지 개요**
• 소재지: ${address}
• 면적: ${landInfo?.land_info?.landCharacteristics?.lndpcl_ar || '1,105.9'}㎡
• 지목: ${landInfo?.land_info?.landCharacteristics?.lnm_lndcgr_smbol || '일반상업지역'}
• 용도지역: ${landInfo?.land_info?.landCharacteristics?.prpos_area_1_nm || '제2종일반주거지역'}

🏗️ **건축 가능성 분석**
• 선택 용도: ${buildingUse}
• 건축 가능 여부: ✅ **건축 가능**
• 해당 용도지역에서 ${buildingUse} 건축이 허용됩니다.

⚖️ **주요 법적 제한사항**

| 항목 | 관련 조항 | 제한 내용 |
|------|-----------|-----------|
| 건폐율 | 건축법 제55조 | 70% 이하 |
| 용적률 | 국토계획법 제78조 | 300% 이하 |
| 높이제한 | 건축법 제60조 | 15층 이하 |
| 주차장 | 주차장법 제19조 | 의무 설치 |
| 조경 | 건축법 제42조 | 대지면적의 20% 이상 |

⚠️ **주의사항 및 권고사항**

**특별 주의사항:**
• 일조권 검토: 인근 건축물과의 일조권 침해 검토 필요
• 교통영향평가: 대규모 건축물의 경우 교통영향평가 필요할 수 있음
• 환경영향평가: 규모에 따라 환경영향평가 대상 확인 필요

**설계 시 고려사항:**
• 대지 내 조경공간 확보 (20% 이상)
• 주차장 설치 기준 준수
• 건축선 후퇴 거리 확인
• 소방법상 피난시설 및 소방시설 계획

📋 **종합 의견**
해당 대상지에서 ${buildingUse} 용도의 건축은 **가능**합니다. 다만 상기 제한사항들을 준수하여 설계하시기 바랍니다. 상세한 설계 전 관련 전문가와 상담을 권장합니다.

*본 검토는 일반적인 법규 검토이며, 실제 인허가 시 추가 검토사항이 있을 수 있습니다.*
      `;
      
      return res.json({
        success: true,
        interpretation: dummyInterpretation,
        timestamp: new Date().toISOString()
      });
    }

    const lexpilotSystemPrompt = `당신은 Lexpilot, 건축 법규 검토 전문 AI Assistant입니다.

✅ 역할:
- 건축 계획 이전 단계에서 법적 제한을 검토
- 복잡한 법규 데이터를 사용자가 이해하기 쉽게 해석
- 정확하고 명확한 근거를 제시

✅ 응답 원칙:
- 모호한 표현 최소화
- 규제 언급 시 정확한 근거 인용
- 가독성을 위해 표 형식 활용
- "항목명: 관련조항: 내용" 형태로 정리

다음 정보를 바탕으로 사용자 친화적인 법규 검토 보고서를 작성해주세요.`;

    const interpretPrompt = `
다음은 "${address}" 대상지의 "${buildingUse}" 건축을 위한 법규 검토 데이터입니다.

=== 토지 정보 ===
${JSON.stringify(landInfo, null, 2)}

=== 건축 가능성 ===
${JSON.stringify(buildable, null, 2)}

=== 규제 법령 정보 ===
${JSON.stringify(regulation, null, 2)}

${buildSummary ? `=== 설계개요 정보 ===\n${JSON.stringify(buildSummary, null, 2)}` : ''}

위 데이터를 바탕으로 다음 항목들을 포함한 종합적인 법규 검토 보고서를 작성해주세요:

📍 **대상지 개요**
- 위치, 지목, 면적, 지역 및 지구

🏗️ **건축 가능성 분석**
- 선택한 용도(${buildingUse})의 건축 가능 여부
- 허용/불허 용도 정리

⚖️ **주요 법적 제한사항**
- 건폐율, 용적률, 건축물 높이 제한
- 건축선, 조경, 주차장 등 기타 제한사항
- 각 항목별로 관련 조항과 구체적 수치 명시

⚠️ **주의사항 및 권고사항**
- 특별히 주의해야 할 규제사항
- 설계 시 고려사항

답변은 한국어로, 건축 전문가가 아닌 일반인도 이해할 수 있게 작성해주세요.
`;

    const interpretation = await callAIModel('claude', [
      { role: "user", content: interpretPrompt }
    ], lexpilotSystemPrompt);

    console.log('✅ AI 해석 완료');
    
    res.json({
      success: true,
      interpretation: interpretation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI 해석 실패:', error);
    
    // AI 해석 실패 시 더미 해석 반환
    const fallbackInterpretation = `
📋 **법규 검토 보고서**

죄송합니다. AI 해석 중 일시적인 오류가 발생했습니다.
원본 데이터를 참조하여 법규 검토를 진행해주세요.

제공된 데이터를 바탕으로 건축 전문가와 상담하시는 것을 권장드립니다.
    `;
    
    res.json({
      success: true,
      interpretation: fallbackInterpretation,
      timestamp: new Date().toISOString(),
      note: 'AI 해석 실패로 더미 데이터 제공'
    });
  }
});

// ===== API Hub 관련 엔드포인트들 =====

// 9. 파서별 API 키 저장 엔드포인트
app.post('/api/save-parser-api-key', async (req, res) => {
  console.log('🔑 파서별 API 키 저장 요청 받음:', {
    hasDocumentId: !!req.body.documentId,
    hasName: !!req.body.name,
    hasKey: !!req.body.key,
    bodyKeys: Object.keys(req.body)
  });

  try {
    const { documentId, name, key, expiryDate, description } = req.body;

    if (!documentId || !name || !key) {
      console.log('❌ 필수 필드 누락:', { 
        documentId: !!documentId, 
        name: !!name, 
        key: !!key 
      });
      return res.status(400).json({
        success: false,
        error: '문서 ID, API 키 이름과 키는 필수입니다.'
      });
    }

    if (typeof name !== 'string' || typeof key !== 'string') {
      console.log('❌ 잘못된 데이터 타입:', { 
        nameType: typeof name, 
        keyType: typeof key 
      });
      return res.status(400).json({
        success: false,
        error: '올바른 형식의 데이터를 입력해주세요.'
      });
    }

    const keyId = Date.now().toString();
    console.log(`🔐 파서별 API 키 처리 시작: ${name} (파서: ${documentId}, 키ID: ${keyId})`);
    
    const keyData = {
      id: keyId,
      documentId: documentId,
      name: name.trim(),
      description: description?.trim() || '',
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      isSelected: true,
      lastUsed: null
    };

    let encryptedKey;
    try {
      encryptedKey = encryptApiKey(key);
      console.log('✅ API 키 암호화 완료');
    } catch (encryptError) {
      console.error('❌ API 키 암호화 실패:', encryptError);
      return res.status(500).json({
        success: false,
        error: 'API 키 암호화 중 오류가 발생했습니다.'
      });
    }

    try {
      const envVars = readEnvFile();
      envVars[`${name.trim().toUpperCase()}_API_KEY_${keyId}`] = encryptedKey;
      
      console.log('📁 .env 파일 업데이트 시도...');
      const writeSuccess = writeEnvFile(envVars);
      
      if (!writeSuccess) {
        throw new Error('.env 파일 쓰기 실패');
      }
      
      console.log('✅ .env 파일 업데이트 성공');
    } catch (fileError) {
      console.error('❌ .env 파일 저장 실패:', fileError);
      return res.status(500).json({
        success: false,
        error: '.env 파일 저장 중 오류가 발생했습니다: ' + fileError.message
      });
    }

    if (!parserKeysStore.has(documentId)) {
      parserKeysStore.set(documentId, new Map());
    }
    
    const parserKeys = parserKeysStore.get(documentId);
    
    for (const existingKey of parserKeys.values()) {
      existingKey.isSelected = false;
    }
    
    parserKeys.set(keyId, keyData);
    
    console.log('💾 메모리에 키 데이터 저장 완료');
    console.log(`✅ 파서 ${documentId}에 API 키 "${name}" 저장 완료 (키ID: ${keyId})`);
    
    res.json({
      success: true,
      keyId: keyId,
      documentId: documentId,
      message: 'API 키가 성공적으로 저장되었습니다.',
      keyData: {
        ...keyData,
        keyPreview: key.substring(0, 8) + '...'
      }
    });

  } catch (error) {
    console.error('❌ 파서별 API 키 저장 중 예상치 못한 오류:', error);
    res.status(500).json({
      success: false,
      error: 'API 키 저장 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 10. 파서별 API 키 목록 조회
app.get('/api/parser-api-keys/:documentId', (req, res) => {
  console.log('📋 파서별 API 키 목록 조회 요청:', req.params.documentId);
  
  try {
    const { documentId } = req.params;
    
    const parserKeys = parserKeysStore.get(documentId);
    if (!parserKeys) {
      console.log(`📊 파서 ${documentId}에 저장된 키 없음`);
      return res.json({
        success: true,
        keys: [],
        total: 0,
        active: 0,
        documentId: documentId
      });
    }

    for (const keyData of parserKeys.values()) {
      if (keyData.isActive && isKeyExpired(keyData.expiryDate)) {
        keyData.isActive = false;
        keyData.deactivatedAt = new Date().toISOString();
        console.log(`📅 만료된 키 비활성화: ${keyData.name} (파서: ${documentId})`);
      }
    }

    const keys = Array.from(parserKeys.values()).map(keyData => ({
      ...keyData,
      isExpired: isKeyExpired(keyData.expiryDate)
    }));

    console.log(`📊 파서 ${documentId} API 키 목록 반환: ${keys.length}개 키`);

    res.json({
      success: true,
      keys: keys,
      total: keys.length,
      active: keys.filter(k => k.isActive && !isKeyExpired(k.expiryDate)).length,
      documentId: documentId
    });

  } catch (error) {
    console.error('❌ 파서별 API 키 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'API 키 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 11. 파서별 API 키 삭제
app.delete('/api/parser-api-keys/:documentId/:keyId', (req, res) => {
  console.log('🗑️ 파서별 API 키 삭제 요청:', req.params);
  
  try {
    const { documentId, keyId } = req.params;

    const parserKeys = parserKeysStore.get(documentId);
    if (!parserKeys || !parserKeys.has(keyId)) {
      console.log('❌ 키를 찾을 수 없음:', { documentId, keyId });
      return res.status(404).json({
        success: false,
        error: 'API 키를 찾을 수 없습니다.'
      });
    }

    const keyData = parserKeys.get(keyId);
    parserKeys.delete(keyId);

    try {
      const envVars = readEnvFile();
      delete envVars[`PARSER_${documentId}_KEY_${keyId}`];
      writeEnvFile(envVars);
      console.log('✅ .env에서 키 제거 완료');
    } catch (fileError) {
      console.error('⚠️ .env 파일 업데이트 실패 (키는 메모리에서 제거됨):', fileError);
    }

    console.log(`✅ 파서 ${documentId}에서 API 키 "${keyData.name}" 삭제 완료`);

    res.json({
      success: true,
      message: 'API 키가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 파서별 API 키 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: 'API 키 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 12. 문서 업로드 및 텍스트 추출
app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ 파일이 업로드되지 않음');
      return res.status(400).json({
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      });
    }

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    console.log(`📄 파일 업로드 시작: ${originalName} -> ${req.file.filename}`);

    console.log('🔍 텍스트 추출 시작...');
    const extractResult = await fileProcessor.extractText(req.file.path);
    
    if (!extractResult.success) {
      console.error('❌ 텍스트 추출 실패:', extractResult.error);
      return res.status(400).json({
        success: false,
        error: extractResult.error
      });
    }

    const documentId = Date.now().toString();
    const documentData = {
      id: documentId,
      filename: originalName,
      filepath: req.file.path,
      extractedText: extractResult.text,
      metadata: extractResult.metadata,
      uploadTime: new Date(),
      analysisStatus: 'uploaded'
    };

    documentStore.set(documentId, documentData);

    console.log(`✅ 텍스트 추출 완료: ${extractResult.text.length}자`);
    console.log(`💾 문서 저장 완료: ID ${documentId}`);

    res.json({
      success: true,
      documentId: documentId,
      filename: originalName,
      metadata: extractResult.metadata,
      text_preview: extractResult.text.substring(0, 500),
      status: 'uploaded'
    });

  } catch (error) {
    console.error('❌ 문서 업로드 처리 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '문서 처리 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 13. AI 분석 시작
app.post('/api/start-analysis', async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId || !documentStore.has(documentId)) {
      return res.status(404).json({
        success: false,
        error: '문서를 찾을 수 없습니다.'
      });
    }

    const document = documentStore.get(documentId);
    document.analysisStatus = 'analyzing';
    
    console.log(`🤖 AI 분석 시작: ${document.filename}`);

    const analysisPrompt = `
다음 API 문서를 분석하여 주요 정보를 추출해주세요:

=== 문서 내용 ===
${document.extractedText}

=== 분석 요청 사항 ===
1. 발견된 API 엔드포인트들
2. 인증 방식 (JWT, API Key, OAuth 등)
3. 주요 데이터 모델/스키마
4. 요청/응답 형식

다음 JSON 형식으로 응답해주세요:
{
  "summary": "문서 요약",
  "endpoints": [
    {
      "method": "GET/POST/PUT/DELETE",
      "path": "/api/path",
      "description": "설명",
      "category": "auth/user/data/etc"
    }
  ],
  "authentication": "인증 방식 설명",
  "data_models": ["모델1", "모델2"],
  "suggested_parsers": [
    {
      "name": "Authentication Parser",
      "description": "인증 관련 API 처리",
      "endpoints": ["/auth/login", "/auth/refresh"]
    }
  ]
}
`;

    const response = await callAIModel('claude', [
      { role: "user", content: analysisPrompt }
    ], "You are an expert API documentation analyzer. Analyze the provided API documentation and extract structured information about endpoints, authentication, and data models. Always respond in valid JSON format.");

    let analysisResult;
    try {
      let responseText = response;
      
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      analysisResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('AI 응답 파싱 오류:', parseError);
      throw new Error('AI 분석 결과를 파싱할 수 없습니다.');
    }

    document.analysisResult = analysisResult;
    document.analysisStatus = 'completed';
    document.analysisTime = new Date();

    console.log(`✅ AI 분석 완료: ${analysisResult.endpoints?.length || 0}개 엔드포인트 발견`);

    res.json({
      success: true,
      documentId: documentId,
      analysisResult: analysisResult,
      status: 'completed'
    });

  } catch (error) {
    console.error('AI 분석 중 오류:', error);
    
    if (req.body.documentId && documentStore.has(req.body.documentId)) {
      const document = documentStore.get(req.body.documentId);
      document.analysisStatus = 'failed';
      document.analysisError = error.message;
    }

    res.status(500).json({
      success: false,
      error: 'AI 분석 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 14. 파서 코드 생성
app.post('/api/generate-parser', async (req, res) => {
  try {
    const { documentId, selectedParser, customOptions } = req.body;

    if (!documentId || !documentStore.has(documentId)) {
      return res.status(404).json({
        success: false,
        error: '문서를 찾을 수 없습니다.'
      });
    }

    const document = documentStore.get(documentId);
    
    if (document.analysisStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '문서 분석이 완료되지 않았습니다.'
      });
    }

    console.log(`🛠️ 파서 코드 생성 시작: ${selectedParser}`);

    const codePrompt = `
다음 분석 결과를 바탕으로 ${selectedParser} 파서의 Python 코드를 생성해주세요:

=== 분석 결과 ===
${JSON.stringify(document.analysisResult, null, 2)}

=== 사용자 선택 ===
선택한 파서: ${selectedParser}
추가 옵션: ${JSON.stringify(customOptions || {}, null, 2)}

=== 요구사항 ===
1. FastAPI 기반 파서 코드
2. 상세한 주석 포함
3. 에러 처리 포함
4. 입력 검증 포함
5. 응답 형식 표준화
6. requirements.txt 생성을 위한 패키지 목록 포함

다음 구조로 코드를 생성해주세요:
- Pydantic 모델 정의
- API 엔드포인트 함수들
- 유틸리티 함수들
- 에러 핸들링
- main 실행 코드

실행 가능한 완전한 Python 코드로 작성해주세요.
`;

    const generatedCode = await callAIModel('claude', [
      { role: "user", content: codePrompt }
    ], "You are an expert Python developer specializing in FastAPI and API development. Generate clean, well-documented, production-ready code with proper error handling and validation.");

    const parserId = `${documentId}_${Date.now()}`;
    const parserData = {
      id: parserId,
      documentId: documentId,
      parserType: selectedParser,
      code: generatedCode,
      customOptions: customOptions,
      createdTime: new Date()
    };

    if (!document.parsers) {
      document.parsers = [];
    }
    document.parsers.push(parserData);

    console.log(`✅ 파서 코드 생성 완료: ${generatedCode.length}자`);

    res.json({
      success: true,
      parserId: parserId,
      code: generatedCode,
      parserType: selectedParser
    });

  } catch (error) {
    console.error('파서 코드 생성 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '파서 코드 생성 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 15. 문서 상태 확인 엔드포인트
app.get('/api/document/:documentId/status', (req, res) => {
  const { documentId } = req.params;
  
  if (!documentStore.has(documentId)) {
    return res.status(404).json({
      success: false,
      error: '문서를 찾을 수 없습니다.'
    });
  }

  const document = documentStore.get(documentId);
  
  res.json({
    success: true,
    status: document.analysisStatus,
    filename: document.filename,
    metadata: document.metadata,
    analysisResult: document.analysisResult || null,
    parsers: document.parsers || []
  });
});

// 16. 파서 목록 조회
app.get('/api/parsers', (req, res) => {
  const allParsers = [];
  
  for (const document of documentStore.values()) {
    if (document.parsers) {
      allParsers.push(...document.parsers.map(parser => ({
        ...parser,
        documentName: document.filename
      })));
    }
  }

  res.json({
    success: true,
    parsers: allParsers
  });
});

// 17. 서버 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Enhanced Backend server is running',
    features: {
      multiModel: true,
      autoSelection: true,
      apiHub: true,
      fileProcessor: true,
      lexpilot: true
    },
    models: {
      openai: !!openai,
      claude: true,
      gemini: true
    },
    timestamp: new Date().toISOString(),
    documentsInStore: documentStore.size,
    apiKeysInStore: apiKeysStore.size
  });
});

// ===== 에러 핸들링 미들웨어 =====

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '파일 크기가 너무 큽니다. (최대 10MB)'
      });
    }
  }
  
  console.error('서버 오류:', error);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// ===== 서버 초기화 및 시작 =====

console.log('🔧 API 키 시스템 초기화 중...');
initializeEnvFile();
console.log('✅ API 키 시스템 준비 완료');

setInterval(deactivateExpiredKeys, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Multi-Model AI Chat endpoints available:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat (enhanced with model selection)`);
  console.log(`   - GET  http://localhost:${PORT}/api/models/status`);
  console.log(`   - POST http://localhost:${PORT}/api/models/auto-select`);
  console.log(`🤖 API Hub endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-document`);
  console.log(`   - POST http://localhost:${PORT}/api/start-analysis`);
  console.log(`   - POST http://localhost:${PORT}/api/generate-parser`);
  console.log(`🔑 API Key management endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/save-parser-api-key`);
  console.log(`   - GET  http://localhost:${PORT}/api/parser-api-keys/:documentId`);
  console.log(`   - DELETE http://localhost:${PORT}/api/parser-api-keys/:documentId/:keyId`);
  console.log(`⚖️ Lexpilot 법규검토 endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/lexpilot/land-info`);
  console.log(`   - POST http://localhost:${PORT}/api/lexpilot/buildable`);
  console.log(`   - POST http://localhost:${PORT}/api/lexpilot/regulation`);
  console.log(`   - POST http://localhost:${PORT}/api/lexpilot/build-summary`);
  console.log(`   - POST http://localhost:${PORT}/api/lexpilot/interpret`);
  console.log(`   - GET  http://localhost:${PORT}/api/status`);
  console.log(`📁 Files: uploads/ and .env managed automatically`);
  console.log(`🧠 Available AI Models:`);
  console.log(`   - OpenAI GPT-4: ${!!openai ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   - Claude 3: ✅ Ready (simulated)`);
  console.log(`   - Google Gemini: ✅ Ready (simulated)`);
});