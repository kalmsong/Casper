// src/components/layout/MainLayout.js (Enhanced with Multi-Model Chat)
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import APIHubCanvas from '../../agents/onboarder/APIHubCanvas';
import LexpilotCanvas from '../../agents/lexpilot/LexpilotCanvas';
import InfoVizCanvas from '../../agents/infoviz/InfoVizCanvas';
import DocsCanvas from '../../agents/docs/DocsCanvas';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 기존 스타일 컴포넌트들 (변경 없음)
const Container = styled.div`
  display: flex;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
`;

const LeftPanel = styled.div`
  width: ${props => props.width}px;
  min-width: 300px;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
`;

const ResizeHandle = styled.div`
  width: 2.5px;
  background: #e5e5e5;
  cursor: col-resize;
  position: relative;
  transition: background-color 0.2s;

  &:hover {
    background: #e5e5e5;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 30px;
    background: #e5e5e5;
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 32px 24px 24px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  letter-spacing: -0.5px;
`;

const AgentSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
`;

const AgentButton = styled.button`
  padding: 12px 8px;
  border: 1px solid ${props => props.active ? '#2563eb' : 'rgba(0, 0, 0, 0.1)'};
  background: ${props => props.active ? '#2563eb' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#6b7280'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  &:hover {
    background: ${props => props.active ? '#1d4ed8' : 'rgba(37, 99, 235, 0.05)'};
    border-color: ${props => props.active ? '#1d4ed8' : 'rgba(37, 99, 235, 0.2)'};
  }
`;

// 새로운 모델 선택 UI 컴포넌트들
const ModelSelector = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
`;

const ModelSelectorTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const ModelCard = styled.button`
  padding: 12px;
  border: 2px solid ${props => props.selected ? '#2563eb' : 'rgba(0, 0, 0, 0.1)'};
  background: ${props => props.selected ? 'rgba(37, 99, 235, 0.05)' : '#ffffff'};
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: ${props => props.selected ? '#1d4ed8' : 'rgba(37, 99, 235, 0.3)'};
    background: ${props => props.selected ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.02)'};
  }
`;

const ModelName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.selected ? '#1d4ed8' : '#1f2937'};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ModelDescription = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.3;
`;

const ModelStatus = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.selected ? '#10b981' : '#d1d5db'};
`;

const AutoModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const ToggleSwitch = styled.button`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  background: ${props => props.active ? '#2563eb' : '#d1d5db'};

  &:after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: ${props => props.active ? '23px' : '3px'};
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ToggleLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

// 기존 스타일 컴포넌트들 계속...
const ToolBar = styled.div`
  display: flex;
  gap: 8px;
`;

const ToolButton = styled.button`
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #374151;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 24px;
  padding: 0;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const InputContainer = styled.div`
  flex: 1;
  position: relative;
`;

const MessageInput = styled.textarea`
  width: 100%;
  min-height: 48px;
  max-height: 120px;
  padding: 9px 15px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  font-size: 12px;
  font-family: inherit;
  resize: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1.4;

  &:focus {
    outline: none;
    border-color: #2563eb;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SendButton = styled.button`
  width: 48px;
  height: 48px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.2);
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultArea = styled.div`
  flex: 1;
  padding: 0;
  overflow: hidden;
`;

const Message = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  position: relative;
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${props => props.isUser ? '0' : '8px'};
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  max-width: 85%;
`;

const MessageBubble = styled.div`
  padding: 10px 13px;
  border-radius: 16px;
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' 
    : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.isUser ? '#ffffff' : '#1f2937'};
  position: relative;
  backdrop-filter: blur(10px);
  line-height: 1.4;
  font-size: 13px;
  box-shadow: ${props => props.isUser 
    ? '0 2px 12px rgba(37, 99, 235, 0.25)' 
    : '0 1px 6px rgba(0, 0, 0, 0.08)'};
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  font-size: 9px;
  color: #9ca3af;
  white-space: nowrap;
  margin-bottom: 2px;
  min-width: 35px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => {
    if (props.isUser) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (props.model === 'openai') return 'linear-gradient(135deg, #00a67e 0%, #00c29a 100%)';
    if (props.model === 'claude') return 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)';
    if (props.model === 'gemini') return 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)';
    return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
`;

const AutoSelectionIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModelBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const blinkCursor = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const TypingCursor = styled.span`
  animation: ${blinkCursor} 1s infinite;
  color: #2563eb;
  font-weight: bold;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #1e40af;
  font-weight: 500;
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const ThinkingDots = styled.div`
  display: flex;
  gap: 4px;
  
  &::after {
    content: '●●●';
    animation: ${pulseAnimation} 1.5s infinite;
    letter-spacing: 2px;
  }
`;

const RightPanelContent = styled.div`
  height: 100%;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
    letter-spacing: -0.5px;
    padding: 32px 32px 0 32px;
  }
  
  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 24px 0;
    padding: 0 32px;
  }
`;

const MainLayout = () => {
  const [activeAgent, setActiveAgent] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  
  // 새로운 상태들 - 모델 관리
  const [selectedModel, setSelectedModel] = useState('openai');
  const [autoMode, setAutoMode] = useState(false);
  const [modelUsageStats, setModelUsageStats] = useState({
    openai: 0,
    claude: 0,
    gemini: 0
  });
  const [lastAutoSelection, setLastAutoSelection] = useState(null); // 마지막 자동 선택 정보

  const messagesEndRef = useRef(null);

  // AI 모델 설정
  const models = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      icon: '🤖',
      description: '브레인스토밍, 창의적 아이디어, 일반 대화',
      specialties: ['브레인스토밍', '창의성', '일반 질문'],
      color: '#00a67e'
    },
    {
      id: 'claude',
      name: 'Claude 3',
      icon: '🧠',
      description: '코딩, 분석, 정리, 논리적 사고',
      specialties: ['코딩', '분석', '정리', '논리적 사고'],
      color: '#ff6b35'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '🔍',
      description: '검색, 최신 정보, 데이터 분석',
      specialties: ['검색', '최신정보', '데이터 분석'],
      color: '#4285f4'
    }
  ];

  const agents = [
  { id: 'chat', name: 'Chat', description: '기본 대화' },
  { id: 'onboarder', name: 'API Hub', description: 'API 연동' },
  { id: 'infoviz', name: 'DataViz', description: '시각화' },
  { id: 'lexpilot', name: 'Lexpilot', description: '법규 검토' },
  { id: 'docs', name: 'Docs', description: '문서 대화' }
  ];

  // 자동 모델 선택 로직
  const selectModelAutomatically = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // 코딩 관련 키워드
    const codingKeywords = ['코드', '프로그래밍', '함수', '버그', '디버그', '리팩토링', '알고리즘', 
                           'python', 'javascript', 'react', 'api', '정리해', '분석해'];
    
    // 검색 관련 키워드  
    const searchKeywords = ['최신', '뉴스', '검색', '찾아', '언제', '어디서', '누가', '트렌드', '현재'];
    
    // 창의성 관련 키워드
    const creativeKeywords = ['아이디어', '브레인스토밍', '창의적', '제안', '방법', '생각', '어떻게'];

    if (codingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'claude';
    } else if (searchKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'gemini';
    } else if (creativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'openai';
    }
    
    return selectedModel; // 판단 안 되면 현재 선택된 모델 유지
  };

  // 패널 리사이징 로직 (기존과 동일)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 타이핑 애니메이션
  const typeMessage = (text, callback) => {
    setIsStreaming(true);
    setStreamingMessage('');
    
    let index = 0;
    const interval = setInterval(() => {
      setStreamingMessage(text.slice(0, index + 1));
      index++;
      
      if (index >= text.length) {
        clearInterval(interval);
        setIsStreaming(false);
        setStreamingMessage('');
        callback();
      }
    }, 20);
  };

  // API Hub에서 오는 메시지 처리
  const handleAPIHubMessage = (message) => {
    const aiMessage = {
      id: Date.now(),
      content: message,
      isUser: false,
      timestamp: new Date(),
      model: 'system'
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  // API Hub에서 데이터 업데이트 처리
  const handleAPIHubDataUpdate = (data) => {
    console.log('API Hub 데이터 업데이트:', data);
    
    if (data.type === 'document_uploaded') {
      setCurrentDocumentId(data.documentId);
    }
  };

  // 향상된 메시지 전송 처리
  const handleSendMessage = async (messageOverride = null) => {
    const actualMessage = messageOverride || inputMessage;
    
    if (!actualMessage.trim() || isLoading) return;

    let modelToUse = selectedModel;
    let autoSelectionReason = null;

    // 자동 모드일 때 백엔드에서 모델 자동 선택
    if (autoMode && activeAgent === 'chat') {
      try {
        console.log('🤖 자동 모드: 최적 모델 선택 중...');
        
        const autoSelectResponse = await fetch('http://localhost:5001/api/models/auto-select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: actualMessage })
        });

        if (autoSelectResponse.ok) {
          const autoSelectData = await autoSelectResponse.json();
          modelToUse = autoSelectData.selectedModel;
          autoSelectionReason = autoSelectData.reasoning;
          
          console.log(`✅ AI가 ${modelToUse} 모델을 선택했습니다: ${autoSelectionReason}`);
          
          // 마지막 자동 선택 정보 저장
          setLastAutoSelection({
            model: modelToUse,
            reason: autoSelectionReason,
            message: actualMessage,
            timestamp: new Date()
          });
          
          // 자동 선택된 모델을 UI에 임시로 표시
          setSelectedModel(modelToUse);
        } else {
          console.warn('⚠️ 자동 선택 실패, 기본 모델 사용');
        }
      } catch (error) {
        console.error('❌ 자동 모델 선택 에러:', error);
        // 에러 시 기본 선택된 모델 사용
      }
    }
    
    const userMessage = {
      id: Date.now(),
      content: actualMessage,
      isUser: true,
      timestamp: new Date(),
      model: modelToUse,
      autoSelected: autoMode && autoSelectionReason ? true : false,
      autoReason: autoSelectionReason
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);

    if (!messageOverride) {
      setInputMessage('');
    }
    setIsLoading(true);

    try {
      const requestBody = {
        message: actualMessage,
        agent: activeAgent,
        model: modelToUse, // 선택된 모델 정보 추가
        history: updatedHistory
      };

      // API Hub의 경우 현재 문서 ID 추가
      if (activeAgent === 'onboarder' && currentDocumentId) {
        requestBody.documentId = currentDocumentId;
      }

      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 모델 사용 통계 업데이트
      setModelUsageStats(prev => ({
        ...prev,
        [modelToUse]: prev[modelToUse] + 1
      }));
      
      typeMessage(data.response, () => {
        const aiMessage = {
          id: Date.now() + 1,
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          model: modelToUse,
          autoSelected: autoMode && autoSelectionReason ? true : false,
          autoReason: autoSelectionReason
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      });
      
    } catch (error) {
      console.error('API 호출 에러:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: `연결 오류가 발생했습니다: ${error.message}`,
        isUser: false,
        timestamp: new Date(),
        model: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 채팅 내보내기
  const exportChat = () => {
    const chatData = {
      agent: activeAgent,
      messages: messages,
      modelUsageStats: modelUsageStats,
      documentId: currentDocumentId,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeAgent}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 채팅 초기화
  const clearChat = () => {
    setMessages([]);
    setStreamingMessage('');
    setCurrentDocumentId(null);
    setModelUsageStats({ openai: 0, claude: 0, gemini: 0 });
  };

  // 에이전트 변경 시 처리
  const handleAgentChange = (agentId) => {
    setActiveAgent(agentId);
    
    // API Hub에서 다른 에이전트로 변경 시 문서 ID 유지하지 않음
    if (agentId !== 'onboarder') {
      setCurrentDocumentId(null);
    }
  };

  // 우측 패널 렌더링
  const renderRightPanel = () => {
    switch (activeAgent) {
      case 'chat':
        return (
          <RightPanelContent>
            <h3>💬 Multi-Model Chat Assistant</h3>
            <p>
              여러 AI 모델을 활용한 고급 채팅 어시스턴트입니다. 
              각 모델의 특장점을 활용하여 최적의 답변을 제공합니다.
            </p>
            
            <div style={{ padding: '0 32px' }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                margin: '0 0 12px 0' 
              }}>
                🎯 모델별 특장점
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                color: '#6b7280'
              }}>
                {models.map(model => (
                  <li key={model.id} style={{ 
                    padding: '8px 0', 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{model.icon}</span>
                    <div>
                      <strong style={{ color: model.color }}>{model.name}:</strong> {model.description}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                fontSize: '13px',
                color: '#0369a1'
              }}>
                <strong>💡 사용법:</strong> 수동으로 모델을 선택하거나 자동 모드를 활성화하여 
                메시지 내용에 따라 AI가 최적의 모델을 자동 선택합니다.
              </div>
            </div>
          </RightPanelContent>
        );
        
      case 'onboarder':
        return (
          <RightPanelContent>
            <APIHubCanvas 
              onSendMessage={handleAPIHubMessage}
              onDataUpdate={handleAPIHubDataUpdate}
            />
          </RightPanelContent>
        );
        
      case 'infoviz':
        return (
          <RightPanelContent>
            <InfoVizCanvas />
          </RightPanelContent>
        );
        
      case 'lexpilot':
        return (
          <RightPanelContent>
            <LexpilotCanvas />
          </RightPanelContent>
        );

      case 'docs':
        return (
          <RightPanelContent>
            <DocsCanvas />
          </RightPanelContent>
        );
        
      default:
        return (
          <RightPanelContent>
            <h3>에이전트를 선택해주세요</h3>
            <p>위에서 원하는 AI 어시스턴트를 선택하여 시작하세요.</p>
          </RightPanelContent>
        );
    }
  };

  // 현재 선택된 모델의 정보를 가져오는 함수
  const getCurrentModel = () => models.find(m => m.id === selectedModel) || models[0];

  return (
    <Container>
      <LeftPanel width={leftPanelWidth}>
        <Header>
          <Title>🤖 AI Workspace</Title>
          <AgentSelector>
            {agents.map(agent => (
              <AgentButton
                key={agent.id}
                active={activeAgent === agent.id}
                onClick={() => handleAgentChange(agent.id)}
              >
                {agent.name}
              </AgentButton>
            ))}
          </AgentSelector>

          {/* 모델 선택 UI - Chat 탭에서만 표시 */}
          {activeAgent === 'chat' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <button
        onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}
      >
        <span>🧠 AI 모델 선택 {autoMode && '(자동 모드)'}</span>
        <span style={{ 
          transform: isModelSelectorOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
                </button>
              </div>

              {isModelSelectorOpen && (
                <ModelSelector>
        <ModelSelectorTitle>
          🧠 AI 모델 선택
          {autoMode && <span style={{ fontSize: '12px', color: '#10b981' }}>• 자동 모드 활성화</span>}
        </ModelSelectorTitle>
        
        <ModelGrid>
          {models.map(model => (
            <ModelCard
              key={model.id}
              selected={selectedModel === model.id}
              onClick={() => setSelectedModel(model.id)}
              disabled={autoMode}
              style={{ opacity: autoMode ? 0.7 : 1 }}
            >
              <ModelStatus selected={selectedModel === model.id} />
              <ModelName selected={selectedModel === model.id}>
                <span>{model.icon}</span>
                {model.name}
              </ModelName>
              <ModelDescription>
                {model.description}
              </ModelDescription>
              {modelUsageStats[model.id] > 0 && (
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  사용횟수: {modelUsageStats[model.id]}회
                </div>
              )}
            </ModelCard>
          ))}
        </ModelGrid>

          <AutoModeToggle>
          <ToggleSwitch
            active={autoMode}
            onClick={() => setAutoMode(!autoMode)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <ToggleLabel>
              자동 모드 (메시지 내용에 따라 AI가 모델 자동 선택)
            </ToggleLabel>
            {lastAutoSelection && autoMode && (
              <div style={{ 
                fontSize: '10px', 
                color: '#10b981',
                fontWeight: '500'
              }}>
                마지막 선택: {models.find(m => m.id === lastAutoSelection.model)?.name} 
                • {lastAutoSelection.reason}
              </div>
            )}
          </div>
          </AutoModeToggle>
                </ModelSelector>
              )}
            </>
          )}

          <ToolBar>
            <ToolButton onClick={exportChat}>📄 Export</ToolButton>
            <ToolButton onClick={clearChat}>🗑️ Clear</ToolButton>
            {activeAgent === 'chat' && (
              <ToolButton onClick={() => setModelUsageStats({ openai: 0, claude: 0, gemini: 0 })}>
                📊 Reset Stats
              </ToolButton>
            )}
          </ToolBar>
        </Header>
        
        <ChatContainer>
          <MessagesArea>
            {messages.map(message => (
              <Message key={message.id} isUser={message.isUser}>
                {/* 자동 선택 표시 */}
                {message.autoSelected && message.autoReason && !message.isUser && (
                  <AutoSelectionIndicator>
                    <span>🤖</span>
                    <span>AI가 <ModelBadge>{message.model}</ModelBadge> 모델을 선택했습니다</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                      • {message.autoReason}
                    </span>
                  </AutoSelectionIndicator>
                )}
                
                <MessageWrapper isUser={message.isUser}>
                  {!message.isUser && (
                    <Avatar isUser={false} model={message.model}>
                      {message.model === 'openai' ? '🤖' : 
                       message.model === 'claude' ? '🧠' : 
                       message.model === 'gemini' ? '🔍' : 'AI'}
                    </Avatar>
                  )}
                  {message.isUser && (
                    <Avatar isUser={true}>YOU</Avatar>
                  )}
                  <div>
                    <MessageBubble isUser={message.isUser}>
  {message.isUser ? (
    message.content
  ) : (
    <div 
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked(message.content))
      }}
    />
  )}
                    </MessageBubble>
                    {!message.isUser && message.model && message.model !== 'system' && (
                      <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        marginTop: '4px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{models.find(m => m.id === message.model)?.name || message.model}</span>
                        {message.autoSelected && (
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: '500'
                          }}>
                            AUTO
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <MessageTime isUser={message.isUser}>
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </MessageTime>
                </MessageWrapper>
              </Message>
            ))}
            
            {isLoading && (
              <StatusIndicator>
                <ThinkingDots />
                {autoMode && activeAgent === 'chat'
                  ? `AI가 최적 모델을 선택했습니다. ${getCurrentModel().name}이(가) 응답을 생성하고 있습니다...`
                  : `${getCurrentModel().name}이(가) 응답을 생성하고 있습니다...`
                }
              </StatusIndicator>
            )}
            
            {isStreaming && (
              <Message isUser={false}>
                <MessageWrapper isUser={false}>
                  <Avatar isUser={false} model={selectedModel}>
                    {selectedModel === 'openai' ? '🤖' : 
                     selectedModel === 'claude' ? '🧠' : 
                     selectedModel === 'gemini' ? '🔍' : 'AI'}
                  </Avatar>
                  <div>
                    <MessageBubble isUser={false}>
  <div 
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(marked(streamingMessage))
    }}
  />
  <TypingCursor>|</TypingCursor>
                    </MessageBubble>
                  </div>
                  <MessageTime isUser={false}>Live</MessageTime>
                </MessageWrapper>
              </Message>
            )}
            
            <div ref={messagesEndRef} />
          </MessagesArea>
          
          <InputArea>
            <InputContainer>
              <MessageInput
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeAgent === 'chat' 
                    ? autoMode 
                      ? '메시지를 입력하세요... (AI가 자동으로 적합한 모델을 선택합니다)'
                      : `${getCurrentModel().name}에게 메시지를 보내세요...`
                    : `${agents.find(a => a.id === activeAgent)?.name}에게 메시지를 보내세요...`
                }
                disabled={isLoading || isStreaming}
              />
            </InputContainer>
            
            <SendButton 
              onClick={() => handleSendMessage()} 
              disabled={isLoading || isStreaming || !inputMessage.trim()}
            >
              ↗
            </SendButton>
          </InputArea>
        </ChatContainer>
      </LeftPanel>

      <ResizeHandle onMouseDown={handleResizeStart} />

      <RightPanel>
        <ResultArea>
          {renderRightPanel()}
        </ResultArea>
      </RightPanel>
    </Container>
  );
};

export default MainLayout;