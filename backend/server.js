// backend/server.js (완전히 교체할 버전)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');
require('dotenv').config();

// 파일 프로세서 import
const { FileProcessor } = require('./file_processor.js');

const app = express();
const PORT = 5001;

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 업로드 디렉토리 생성: ${uploadDir}`);
}

// .env 파일 경로
const envPath = path.join(__dirname, '.env');

// API 키 저장소 (실제 환경에서는 데이터베이스 사용 권장)
const apiKeysStore = new Map();

// ===== .env 파일 관리 함수들 =====

// 초기화 시 .env 파일이 없으면 생성
function initializeEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      // 기본 .env 파일 생성
      const defaultEnv = `# API Hub Environment Variables
OPENAI_API_KEY=your-openai-key-here
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

// .env 파일 읽기 함수
function readEnvFile() {
  try {
    initializeEnvFile(); // .env 파일이 없으면 생성
    
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

// .env 파일 쓰기 함수
function writeEnvFile(envVars) {
  try {
    // 기존 주석과 빈 줄 보존
    let existingContent = '';
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 새로운 내용 생성
    const lines = [];
    const existingLines = existingContent.split('\n');
    const processedKeys = new Set();
    
    // 기존 라인들을 처리하면서 업데이트된 값 적용
    existingLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=') || !trimmed) {
        // 주석이나 빈 줄은 그대로 유지
        lines.push(line);
      } else {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        
        if (envVars.hasOwnProperty(key)) {
          lines.push(`${key}=${envVars[key]}`);
          processedKeys.add(key);
        } else {
          lines.push(line); // 기존 값 유지
        }
      }
    });
    
    // 새로운 키들 추가
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
    console.error('상세 오류:', error.message);
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
    
    // 32바이트 키로 해싱
    const algorithm = 'aes-256-cbc';
    const secretKey = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV와 암호화된 데이터를 함께 저장
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
    
    // IV와 암호화된 데이터 분리
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
      console.log(`🔐 만료된 키 비활성화: ${keyData.name} (ID: ${keyId})`);
    }
  }
  
  return hasChanges;
}

// ===== Multer 설정 =====

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 한글 파일명 안전하게 처리
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    
    console.log(`📝 파일명 처리: ${originalName} -> ${safeFilename}`);
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
    
    console.log(`🔍 파일 필터링: ${originalName} (${fileExt})`);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`지원되지 않는 파일 형식입니다: ${fileExt}`), false);
    }
  }
});

// ===== 미들웨어 설정 =====

app.use(cors());
app.use(express.json());

// ===== OpenAI 설정 =====

const apiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OpenAI API 키가 설정되지 않았습니다!');
  console.error('📝 .env 파일에 OPENAI_API_KEY=your-key-here 를 추가해주세요');
  process.exit(1);
} else {
  console.log('✅ OpenAI API 키 로드 완료');
}

const openai = new OpenAI({
  apiKey: apiKey
});

// ===== 파일 프로세서 초기화 =====

console.log('🔧 FileProcessor 인스턴스 생성 중...');
const fileProcessor = new FileProcessor();
console.log('✅ FileProcessor 준비 완료');

// ===== 임시 저장소 =====

const documentStore = new Map();

// ===== API 키 관련 엔드포인트들 =====
// 파서별 키 저장소 (글로벌 변수 추가)
const parserKeysStore = new Map(); // documentId -> Map(keyId -> keyData)

// 파서별 API 키 저장 엔드포인트
app.post('/api/save-parser-api-key', async (req, res) => {
  console.log('📝 파서별 API 키 저장 요청 받음:', {
    hasDocumentId: !!req.body.documentId,
    hasName: !!req.body.name,
    hasKey: !!req.body.key,
    bodyKeys: Object.keys(req.body)
  });

  try {
    const { documentId, name, key, expiryDate, description } = req.body;

    // 입력 검증
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

    // 키 ID 생성
    const keyId = Date.now().toString();
    
    console.log(`🔑 파서별 API 키 처리 시작: ${name} (파서: ${documentId}, 키ID: ${keyId})`);
    
    // 키 데이터 생성
    const keyData = {
      id: keyId,
      documentId: documentId,
      name: name.trim(),
      description: description?.trim() || '',
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      isSelected: true, // 새로 추가된 키는 기본 선택
      lastUsed: null
    };

    // 암호화된 키 생성
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

    // .env 파일에 저장 (파서별로 구분)
    try {
      const envVars = readEnvFile();
      envVars[`PARSER_${documentId}_KEY_${keyId}`] = encryptedKey;
      
      console.log('📝 .env 파일 업데이트 시도...');
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

    // 메모리에 저장 (파서별로 그룹화)
    if (!parserKeysStore.has(documentId)) {
      parserKeysStore.set(documentId, new Map());
    }
    
    const parserKeys = parserKeysStore.get(documentId);
    
    // 기존 키들의 isSelected를 false로 변경 (새 키를 기본 선택으로)
    for (const existingKey of parserKeys.values()) {
      existingKey.isSelected = false;
    }
    
    // 새 키 추가
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
        // 보안을 위해 실제 키는 반환하지 않음
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

// 파서별 API 키 목록 조회
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

    // 만료된 키 자동 비활성화 체크
    for (const keyData of parserKeys.values()) {
      if (keyData.isActive && isKeyExpired(keyData.expiryDate)) {
        keyData.isActive = false;
        keyData.deactivatedAt = new Date().toISOString();
        console.log(`🔐 만료된 키 비활성화: ${keyData.name} (파서: ${documentId})`);
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

// 파서별 API 키 삭제
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

    // .env에서도 제거
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

// ===== 기존 엔드포인트들 =====

// 1단계: 문서 업로드 및 텍스트 추출
app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ 파일이 업로드되지 않음');
      return res.status(400).json({
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      });
    }

    // 한글 파일명 복원
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    console.log(`📄 파일 업로드 시작: ${originalName} -> ${req.file.filename}`);
    console.log(`📍 파일 경로: ${req.file.path}`);
    console.log(`📏 파일 크기: ${req.file.size} bytes`);

    // 파일에서 텍스트 추출
    console.log('🔍 텍스트 추출 시작...');
    const extractResult = await fileProcessor.extractText(req.file.path);
    
    console.log('📊 추출 결과:', {
      success: extractResult.success,
      textLength: extractResult.text?.length || 0,
      error: extractResult.error
    });
    
    if (!extractResult.success) {
      console.error('❌ 텍스트 추출 실패:', extractResult.error);
      return res.status(400).json({
        success: false,
        error: extractResult.error
      });
    }

    // 문서 정보를 임시 저장
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

// 2단계: AI 분석 시작
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

    // AI에게 문서 분석 요청
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert API documentation analyzer. Analyze the provided API documentation and extract structured information about endpoints, authentication, and data models. Always respond in valid JSON format."
        },
        { role: "user", content: analysisPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    let analysisResult;
    try {
      // AI 응답에서 JSON 추출
      let responseText = completion.choices[0].message.content;
      
      // JSON 블록에서 내용만 추출
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      analysisResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('AI 응답 파싱 오류:', parseError);
      throw new Error('AI 분석 결과를 파싱할 수 없습니다.');
    }

    // 분석 결과 저장
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
    
    // 실패 상태로 업데이트
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

// 3단계: 파서 코드 생성
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

    // 선택된 파서에 따른 코드 생성 프롬프트
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert Python developer specializing in FastAPI and API development. Generate clean, well-documented, production-ready code with proper error handling and validation."
        },
        { role: "user", content: codePrompt }
      ],
      max_tokens: 3000,
      temperature: 0.2
    });

    const generatedCode = completion.choices[0].message.content;

    // 생성된 코드 저장
    const parserId = `${documentId}_${Date.now()}`;
    const parserData = {
      id: parserId,
      documentId: documentId,
      parserType: selectedParser,
      code: generatedCode,
      customOptions: customOptions,
      createdTime: new Date()
    };

    // 문서에 파서 정보 추가
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

// 기존 채팅 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agent, history = [], documentId } = req.body;

    const conversationHistory = history.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content
    }));
    
    // 에이전트별 시스템 메시지
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
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
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

// 문서 상태 확인 엔드포인트
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

// 파서 목록 조회
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

// 서버 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Backend server is running',
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

// 서버 시작 시 초기화
console.log('🔧 API 키 시스템 초기화 중...');
initializeEnvFile();
console.log('✅ API 키 시스템 준비 완료');

// 정기적으로 만료된 키 체크 (1시간마다)
setInterval(deactivateExpiredKeys, 60 * 60 * 1000);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available:`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-document`);
  console.log(`   - POST http://localhost:${PORT}/api/start-analysis`);
  console.log(`   - POST http://localhost:${PORT}/api/generate-parser`);
  console.log(`   - POST http://localhost:${PORT}/api/save-parser-api-key`);
  console.log(`   - GET  http://localhost:${PORT}/api/parser-api-keys/:documentId`);
  console.log(`   - DELETE http://localhost:${PORT}/api/parser-api-keys/:documentId/:keyId`);
  console.log(`   - POST http://localhost:${PORT}/api/chat`);
  console.log(`   - GET  http://localhost:${PORT}/api/status`);
  console.log(`📁 Files: uploads/ and .env managed automatically`);
});