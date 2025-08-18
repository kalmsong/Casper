// src/agents/onboarder/APIHubCanvas.js (업데이트된 버전)
import React, { useState, useCallback, useEffect } from 'react';

// 분할된 컴포넌트들 import
import FileDropZone from './components/upload/FileDropZone';
import QuickGuide from './components/upload/QuickGuide';
import ParserList from './components/upload/ParserList';
import APISelectionPanel from './components/analysis/APISelectionPanel';

// 스타일 import
import { uploadStyles, analysisStyles, editorStyles, commonStyles } from './styles/components';

// 기존 스타일들 (아직 분리하지 않은 것들)
const styles = {
  apiHubCanvas: {
    height: '100vh',
    padding: '24px',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box'
  },
  
  uploadLayout: {
    display: 'flex',
    gap: '24px',
    flex: 1
  },
  
  fileDropContainer: {
    flex: 1,
    cursor: 'pointer'
  },

  // 워크스페이스 관련 스타일들
  workspaceLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#ffffff'
  },
  
  fileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f8f9fa',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px'
  },
  
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  fileIcon: {
    fontSize: '16px'
  },
  
  parserNameInput: {
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
    minWidth: '200px'
  },
  
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  
  headerButton: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s'
  },
  
  registerButton: {
    backgroundColor: '#10b981',
    color: 'white',
    borderColor: '#10b981'
  },

  // 업로드 완료 상태 스타일
  uploadCompleteArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    padding: '32px'
  },
  
  uploadSuccessIcon: {
    fontSize: '64px',
    marginBottom: '24px'
  },
  
  uploadSuccessTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  
  uploadSuccessDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '32px',
    textAlign: 'center',
    lineHeight: '1.5'
  },
  
  aiSetupButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  // 메인 작업 공간
  mainWorkspace: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  
  codeEditorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e2e8f0'
  },
  
  codeEditorHeader: {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  
  codeEditor: {
    flex: 1,
    padding: '16px',
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    backgroundColor: '#ffffff',
    border: 'none',
    outline: 'none',
    resize: 'none'
  },

  // 테스터 영역
  testerArea: {
    width: '450px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff'
  },
  
  testerTabs: {
    display: 'flex',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e2e8f0'
  },
  
  testerTab: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s'
  },
  
  testerTabActive: {
    color: '#1f2937',
    borderBottomColor: '#3b82f6',
    backgroundColor: '#ffffff'
  },
  
  testerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  // 콘솔 스타일
  console: {
    flex: 1,
    padding: '16px',
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    fontSize: '13px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    overflow: 'auto'
  },
  
  consoleLine: {
    marginBottom: '4px',
    lineHeight: '1.4'
  },
  
  consoleSuccess: {
    color: '#22c55e'
  },
  
  consoleError: {
    color: '#ef4444'
  },
  
  consoleWarning: {
    color: '#f59e0b'
  },
  
  consoleInfo: {
    color: '#3b82f6'
  }
};

// 컴포넌트들
const FileHeader = ({ parserName, onParserNameChange, onRegisterParser, onClose }) => (
  <div style={styles.fileHeader}>
    <div style={styles.fileInfo}>
      <span style={styles.fileIcon}>🤖</span>
      <span style={{ marginRight: '8px', color: '#6b7280' }}>파서 이름:</span>
      <input
        type="text"
        value={parserName}
        onChange={(e) => onParserNameChange(e.target.value)}
        placeholder="파서 이름을 입력하세요"
        style={styles.parserNameInput}
      />
    </div>
    <div style={styles.headerActions}>
      <button 
        style={{...styles.headerButton, ...styles.registerButton}} 
        onClick={onRegisterParser}
      >
        💾 파서 등록
      </button>
      <button style={styles.headerButton} onClick={onClose}>
        ✕ 닫기
      </button>
    </div>
  </div>
);

const UploadCompleteArea = ({ file, onAISetup }) => (
  <div style={styles.uploadCompleteArea}>
    <div style={styles.uploadSuccessIcon}>✅</div>
    <h3 style={styles.uploadSuccessTitle}>업로드 완료!</h3>
    <p style={styles.uploadSuccessDescription}>
      {file.name} 파일이 성공적으로 업로드되었습니다.<br />
      AI와 함께 파서를 설정해보세요.
    </p>
    <button 
      style={styles.aiSetupButton}
      onClick={onAISetup}
      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
    >
      🤖 AI와 설정하기
    </button>
  </div>
);

const CodeEditor = ({ code, onChange, isGenerating }) => (
  <div style={styles.codeEditorArea}>
    <div style={styles.codeEditorHeader}>
      💻 Parser Code Editor
      {isGenerating && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⏳ AI 생성 중...</span>}
    </div>
    <textarea
      style={styles.codeEditor}
      value={code}
      onChange={(e) => onChange(e.target.value)}
      placeholder="# AI가 생성한 파서 코드가 여기에 표시됩니다
# 채팅창에서 AI와 설정을 완료하면 코드가 자동으로 생성됩니다"
    />
  </div>
);

const Console = ({ logs }) => (
  <div style={styles.console}>
    {logs.map((log, index) => (
      <div key={index} style={{
        ...styles.consoleLine,
        ...(log.type === 'success' ? styles.consoleSuccess : {}),
        ...(log.type === 'error' ? styles.consoleError : {}),
        ...(log.type === 'warning' ? styles.consoleWarning : {}),
        ...(log.type === 'info' ? styles.consoleInfo : {})
      }}>
        {log.message}
      </div>
    ))}
    {logs.length === 0 && (
      <div style={styles.consoleLine}>
        <span style={styles.consoleInfo}>$ AI 분석 대기 중... "AI와 설정하기"를 클릭하세요</span>
      </div>
    )}
  </div>
);

const TesterArea = ({ activeTab, onTabChange, consoleLogs }) => {
  const tabs = [
    { id: 'console', name: 'Console', icon: '🖥️' },
    { id: 'tester', name: 'API Tester', icon: '🧪' }
  ];

  return (
    <div style={styles.testerArea}>
      <div style={styles.testerTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.testerTab,
              ...(activeTab === tab.id ? styles.testerTabActive : {})
            }}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>
      <div style={styles.testerContent}>
        {activeTab === 'console' ? (
          <Console logs={consoleLogs} />
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
            🚧 API 테스터 기능 개발 중...
          </div>
        )}
      </div>
    </div>
  );
};

// 메인 APIHubCanvas 컴포넌트
const APIHubCanvas = ({ onSendMessage, onDataUpdate }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('console');
  const [code, setCode] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [parserName, setParserName] = useState('');
  const [currentStep, setCurrentStep] = useState('upload'); // upload -> analysis -> selection -> generation
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [parsers, setParsers] = useState([]);
  const [savedAPIKeys, setSavedAPIKeys] = useState([]);

    const loadParserAPIKeys = async () => {
    if (!documentId) return;
    
    try {
      console.log('🔄 파서별 API 키 목록 새로고침...', documentId);
      
      const response = await fetch(`http://localhost:5001/api/parser-api-keys/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 파서 API 키 목록 로드 완료:', {
          documentId: data.documentId,
          total: data.total,
          active: data.active,
          keys: data.keys.map(k => ({ id: k.id, name: k.name, isSelected: k.isSelected }))
        });
        
        setSavedAPIKeys(data.keys || []);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ 파서 API 키 목록 로드 실패:', error);
      setConsoleLogs(prev => [
        ...prev,
        { type: 'warning', message: `⚠️ API 키 목록 로드 실패: ${error.message}` }
      ]);
    }
  };

  // documentId가 변경될 때마다 해당 파서의 키 목록 로드
  useEffect(() => {
    if (documentId) {
      loadParserAPIKeys();
    } else {
      setSavedAPIKeys([]); // documentId가 없으면 키 목록 초기화
    }
  }, [documentId]);

  // 파서별 API 키 저장 핸들러 (수정된 버전)
const handleSaveAPIKey = async (keyData) => {
  if (!documentId) {
    alert('문서를 먼저 업로드해주세요.');
    return;
  }

  try {
    console.log('APIHubCanvas: 파서별 API 키 저장 시도:', {
      documentId,
      name: keyData.name,
      hasKey: !!keyData.key,
      keyLength: keyData.key?.length
    });

    const requestData = {
      documentId: documentId,  // 현재 파서의 documentId
      name: keyData.name.trim(),
      key: keyData.key.trim(),
      expiryDate: keyData.expiryDate || null,
      description: keyData.description?.trim() || ''
    };

    console.log('전송할 데이터:', {
      ...requestData,
      key: '[HIDDEN]' // 로그에서는 키 숨김
    });

    const response = await fetch('http://localhost:5001/api/save-parser-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      
      let errorMessage = '서버 오류가 발생했습니다.';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('API 키 저장 응답:', result);

    if (result.success) {
      // 응답 데이터 구조 확인
      console.log('저장 성공 - 응답 데이터:', {
        keyId: result.keyId,
        documentId: result.documentId,
        keyData: result.keyData
      });

      setConsoleLogs(prev => [
        ...prev,
        { type: 'success', message: `🔐 파서용 API 키 "${keyData.name}" 저장 완료` },
        { type: 'info', message: `🆔 키 ID: ${result.keyId || result.keyData?.id || 'ID 없음'}` },
        { type: 'info', message: `📄 파서 ID: ${documentId}` }
      ]);
      
      // 파서별 키 목록 새로고침
      await loadParserAPIKeys();
      
      return result.keyData; // keyData 반환
    } else {
      throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
    }

  } catch (error) {
    console.error('파서별 API 키 저장 실패:', error);
    setConsoleLogs(prev => [
      ...prev,
      { type: 'error', message: `❌ API 키 저장 실패: ${error.message}` }
    ]);
    throw error; // 에러를 다시 던져서 컴포넌트에서 처리할 수 있도록
  }
};

  // 파서별 API 키 삭제 핸들러
  const handleDeleteAPIKey = async (keyId) => {
    if (!documentId) {
      alert('문서 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      console.log('APIHubCanvas: 파서별 API 키 삭제 시도:', { documentId, keyId });

      const response = await fetch(`http://localhost:5001/api/parser-api-keys/${documentId}/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '삭제 중 서버 오류가 발생했습니다.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        setConsoleLogs(prev => [
          ...prev,
          { type: 'info', message: `🗑️ 파서 API 키 삭제 완료 (ID: ${keyId})` }
        ]);
        
        // 파서별 키 목록 새로고침
        await loadParserAPIKeys();
      } else {
        throw new Error(result.error || '삭제에 실패했습니다.');
      }

      } catch (error) {
        console.error('파서별 API 키 삭제 실패:', error);
        setConsoleLogs(prev => [
        ...prev,
        { type: 'error', message: `❌ API 키 삭제 실패: ${error.message}` }
        ]);
        throw error;
      }
    };


  // 드래그앤드롭 핸들러들
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // 1단계: 파일 업로드
  const uploadFile = async (file) => {
    try {
      setIsGenerating(true);
      setConsoleLogs([{ type: 'info', message: '> 파일 업로드 중...' }]);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/api/analyze-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedFile(file);
        setDocumentId(result.documentId);
        setCurrentStep('uploaded');
        
        // 파일명에서 확장자 제거하고 파서 이름 기본값 설정
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        setParserName(`${baseName} Parser`);
        
        setConsoleLogs(prev => [
          ...prev,
          { type: 'success', message: `✓ 파일 업로드 완료: ${result.filename}` },
          { type: 'info', message: `> 메타데이터: ${JSON.stringify(result.metadata)}` },
          { type: 'success', message: `✓ 텍스트 추출 완료` },
          { type: 'info', message: '> "AI와 설정하기" 버튼을 클릭하여 분석을 시작하세요' }
        ]);
      } else {
        setConsoleLogs(prev => [
          ...prev,
          { type: 'error', message: `❯ 파일 처리 실패: ${result.error}` }
        ]);
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setConsoleLogs(prev => [
        ...prev,
        { type: 'error', message: `❯ 업로드 실패: ${error.message}` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2단계: AI 분석 시작
  const handleAISetup = async () => {
    if (!documentId) return;

    try {
      setIsGenerating(true);
      setCurrentStep('analysis');
      
      const analysisLogs = [
        { type: 'info', message: '> AI 문서 분석 시작...' },
        { type: 'info', message: '> API 엔드포인트 탐지 중...' },
        { type: 'info', message: '> 인증 방식 분석 중...' },
        { type: 'info', message: '> 데이터 모델 추출 중...' }
      ];
      
      // 단계별 로그 표시
      for (let i = 0; i < analysisLogs.length; i++) {
        setTimeout(() => {
          setConsoleLogs(prev => [...prev, analysisLogs[i]]);
        }, i * 800);
      }

      const response = await fetch('http://localhost:5001/api/start-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      });

      if (!response.ok) {
        throw new Error(`분석 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.analysisResult);
        setCurrentStep('selection');
        
        setTimeout(() => {
          setConsoleLogs(prev => [
            ...prev,
            { type: 'success', message: `✓ AI 분석 완료!` },
            { type: 'info', message: `> 발견된 엔드포인트: ${result.analysisResult.endpoints?.length || 0}개` },
            { type: 'info', message: `> 인증 방식: ${result.analysisResult.authentication || 'N/A'}` },
            { type: 'success', message: '✓ 오른쪽에서 API 키를 등록하고 파서 타입을 선택하세요' }
          ]);
          setIsGenerating(false);
        }, 3000);

        // 채팅창에 분석 결과 전송
        if (onSendMessage) {
          const analysisMessage = formatAnalysisMessage(result.analysisResult);
          setTimeout(() => {
            onSendMessage(analysisMessage);
          }, 3500);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      setConsoleLogs(prev => [
        ...prev,
        { type: 'error', message: `❯ AI 분석 실패: ${error.message}` }
      ]);
      setIsGenerating(false);
      setCurrentStep('uploaded'); // 실패 시 이전 단계로 복귀
    }
  };

  // 분석 결과를 채팅 메시지로 포맷팅
  const formatAnalysisMessage = (analysisResult) => {
    let message = `🤖 문서 분석이 완료되었습니다!

📊 **분석 결과 요약**:
- 발견된 API 엔드포인트: ${analysisResult.endpoints?.length || 0}개
- 인증 방식: ${analysisResult.authentication || 'N/A'}
- 데이터 모델: ${analysisResult.data_models?.join(', ') || 'N/A'}

📋 **발견된 주요 엔드포인트**:`;

    if (analysisResult.endpoints) {
      analysisResult.endpoints.slice(0, 10).forEach(endpoint => {
        message += `\n• ${endpoint.method} ${endpoint.path} - ${endpoint.description || '설명 없음'}`;
      });
      
      if (analysisResult.endpoints.length > 10) {
        message += `\n... 외 ${analysisResult.endpoints.length - 10}개 더`;
      }
    }

    message += `\n\n🛠️ **추천 파서 타입**:`;
    if (analysisResult.suggested_parsers) {
      analysisResult.suggested_parsers.forEach((parser, index) => {
        message += `\n${index + 1}. **${parser.name}**: ${parser.description}`;
      });
    }

    message += `\n\n**다음 단계를 선택해주세요:**
오른쪽 패널에서 API 키를 등록하고 원하는 파서 타입을 선택하신 후 "파서 생성하기"를 눌러주세요.`;

    return message;
  };

  // 엔드포인트 선택 토글
  const handleEndpointToggle = (endpointId, endpoint) => {
    setSelectedEndpoints(prev => {
      if (prev.includes(endpointId)) {
        return prev.filter(id => id !== endpointId);
      } else {
        return [...prev, endpointId];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = (selectAll) => {
    if (!analysisResult?.endpoints) return;
    
    if (selectAll) {
      const allEndpointIds = analysisResult.endpoints.map(
        endpoint => `${endpoint.method}_${endpoint.path}`
      );
      setSelectedEndpoints(allEndpointIds);
    } else {
      setSelectedEndpoints([]);
    }
  };

  // 선택 옵션 변경 시 엔드포인트 선택 초기화
  const handleSelectionChange = (option) => {
    setSelectedOption(option);
    if (option !== 'custom') {
      setSelectedEndpoints([]);
    }
  };

  // 3단계: 사용자 선택 처리
  const handleSelectionContinue = async () => {
    try {
      setIsGenerating(true);
      setCurrentStep('generation');
      
      setConsoleLogs(prev => [
        ...prev,
        { type: 'info', message: `> ${selectedOption} 파서 생성 시작...` },
        { type: 'info', message: '> 코드 템플릿 생성 중...' },
        { type: 'info', message: '> API 모델 정의 중...' },
        { type: 'info', message: '> 에러 핸들링 추가 중...' }
      ]);

      const customOptions = {
        parserType: selectedOption,
        includeValidation: true,
        includeErrorHandling: true,
        outputFormat: 'fastapi',
        selectedEndpoints: selectedOption === 'custom' ? selectedEndpoints : null
      };

      // 커스텀 선택인 경우 추가 정보
      if (selectedOption === 'custom') {
        setConsoleLogs(prev => [
          ...prev,
          { type: 'info', message: `> 선택된 API: ${selectedEndpoints.length}개` }
        ]);
      }

      const response = await fetch('http://localhost:5001/api/generate-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          selectedParser: selectedOption,
          customOptions
        })
      });

      if (!response.ok) {
        throw new Error(`파서 생성 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCode(result.code);
        
        setTimeout(() => {
          setConsoleLogs(prev => [
            ...prev,
            { type: 'success', message: `✓ ${selectedOption} 파서 코드 생성 완료!` },
            { type: 'info', message: `> 코드 길이: ${result.code.length}자` },
            { type: 'success', message: '✓ 코드 에디터에서 확인하고 수정할 수 있습니다' },
            { type: 'info', message: '> 파서 이름을 설정하고 "파서 등록"을 클릭하세요' }
          ]);
          setIsGenerating(false);
        }, 2000);

        // 파서 목록 새로고침
        await loadParserAPIKeys();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('파서 생성 실패:', error);
      setConsoleLogs(prev => [
        ...prev,
        { type: 'error', message: `❯ 파서 생성 실패: ${error.message}` }
      ]);
      setIsGenerating(false);
    }
  };

  // 파서 등록
  const handleRegisterParser = () => {
    if (!parserName.trim()) {
      alert('파서 이름을 입력해주세요.');
      return;
    }
    
    if (!code.trim()) {
      alert('생성된 코드가 없습니다.');
      return;
    }
    
    // 성공 메시지
    setConsoleLogs(prev => [
      ...prev,
      { type: 'success', message: `✓ "${parserName}" 파서가 성공적으로 등록되었습니다!` },
      { type: 'info', message: '> 파서 목록에서 확인할 수 있습니다' }
    ]);
    
    if (onSendMessage) {
      onSendMessage(`✅ "${parserName}" 파서가 성공적으로 등록되었습니다!`);
    }
    
    // 파서 목록 새로고침
    loadParserAPIKeys();
  };

  // 파일 닫기
  const handleCloseFile = () => {
    setUploadedFile(null);
    setDocumentId(null);
    setIsGenerating(false);
    setCode('');
    setConsoleLogs([]);
    setParserName('');
    setCurrentStep('upload');
    setAnalysisResult(null);
    setSelectedOption('');
    setSelectedEndpoints([]);
    setSavedAPIKeys([]); // API 키 목록도 초기화
  };

  // 드롭존 클릭 핸들러
  const handleDropZoneClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.xlsx,.txt';
    input.onchange = handleFileSelect;
    input.click();
  };

  // 파서 선택 핸들러
  const handleSelectParser = (parser) => {
    setCode(parser.code);
    setParserName(parser.parserType);
    setCurrentStep('generation');
    setConsoleLogs(prev => [
      ...prev,
      { type: 'info', message: `> 기존 파서 "${parser.parserType}" 로드됨` },
      { type: 'success', message: '✓ 코드 에디터에서 확인하고 수정할 수 있습니다' }
    ]);
  };

  // Props 기본값 설정
  const sendMessage = onSendMessage || ((message) => console.log('메시지:', message));
  const updateData = onDataUpdate || ((data) => console.log('데이터 업데이트:', data));

  // 현재 단계에 따른 렌더링
  if (currentStep === 'upload') {
    return (
      <div style={styles.apiHubCanvas}>
        <QuickGuide />
        <div style={styles.uploadLayout}>
          <div 
            style={styles.fileDropContainer}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <FileDropZone isDragActive={isDragActive} onClick={handleDropZoneClick} />
          </div>
          <ParserList parsers={parsers} onSelectParser={handleSelectParser} />
        </div>
      </div>
    );
  }

  // 파일이 업로드된 후의 작업 공간
  return (
    <div style={styles.workspaceLayout}>
      <FileHeader 
        parserName={parserName}
        onParserNameChange={setParserName}
        onRegisterParser={handleRegisterParser}
        onClose={handleCloseFile}
      />
      
      <div style={styles.mainWorkspace}>
        {currentStep === 'uploaded' && (
          <UploadCompleteArea 
            file={uploadedFile}
            onAISetup={handleAISetup}
          />
        )}
        
        {currentStep === 'analysis' && (
          <div style={styles.uploadCompleteArea}>
            <div style={styles.uploadSuccessIcon}>🤖</div>
            <h3 style={styles.uploadSuccessTitle}>AI 분석 중...</h3>
            <p style={styles.uploadSuccessDescription}>
              AI가 문서를 분석하고 있습니다.<br />
              잠시만 기다려주세요.
            </p>
          </div>
        )}
        
        {currentStep === 'selection' && (
          <APISelectionPanel 
            analysisResult={analysisResult}
            onSelectionChange={handleSelectionChange}
            selectedOption={selectedOption}
            selectedEndpoints={selectedEndpoints}
            onEndpointToggle={handleEndpointToggle}
            onSelectAll={handleSelectAll}
            onContinue={handleSelectionContinue}
            savedAPIKeys={savedAPIKeys}
            onSaveAPIKey={handleSaveAPIKey}
            onDeleteKey={handleDeleteAPIKey}
            onDeleteAPIKey={handleDeleteAPIKey}
          />
        )}
        
        {currentStep === 'generation' && (
          <CodeEditor 
            code={code}
            onChange={setCode}
            isGenerating={isGenerating}
          />
        )}
        
        <TesterArea 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          consoleLogs={consoleLogs}
        />
      </div>
    </div>
  );
};

export default APIHubCanvas;