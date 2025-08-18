// src/components/layout/MainLayout.js
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import APIHubCanvas from '../../agents/onboarder/APIHubCanvas';

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
  grid-template-columns: repeat(3, 1fr);
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
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
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
  const messagesEndRef = useRef(null);

  const agents = [
    { id: 'chat', name: 'Chat', description: '기본 대화' },
    { id: 'onboarder', name: 'API Hub', description: 'API 연동' },
    { id: 'infoviz', name: 'DataViz', description: '시각화' }
  ];

  // 패널 리사이징 로직
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
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  // API Hub에서 데이터 업데이트 처리
  const handleAPIHubDataUpdate = (data) => {
    console.log('API Hub 데이터 업데이트:', data);
    
    if (data.type === 'document_uploaded') {
      setCurrentDocumentId(data.documentId);
    }
    
    // 필요에 따라 다른 데이터 업데이트 처리 추가
  };

  // 메시지 전송 처리
  const handleSendMessage = async (messageOverride = null) => {
    const actualMessage = messageOverride || inputMessage;
    
    if (!actualMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: actualMessage,
      isUser: true,
      timestamp: new Date()
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
      
      typeMessage(data.response, () => {
        const aiMessage = {
          id: Date.now() + 1,
          content: data.response,
          isUser: false,
          timestamp: new Date()
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
        timestamp: new Date()
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
            <h3>💬 Chat Assistant</h3>
            <p>
              일반적인 질문과 대화를 위한 AI 어시스턴트입니다. 
              자연스러운 대화를 통해 다양한 주제에 대해 도움을 받을 수 있습니다.
            </p>
            
            <div style={{ padding: '0 32px' }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                margin: '0 0 12px 0' 
              }}>
                💡 사용 팁
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  ● 구체적이고 명확한 질문을 해보세요
                </li>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  ● 단계별 설명이 필요하면 요청하세요
                </li>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  ● 예시나 비교를 요청할 수 있습니다
                </li>
                <li style={{ padding: '8px 0' }}>
                  ● 언어, 프로그래밍, 창작 등 다양한 도움 가능
                </li>
              </ul>
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
            <h3>📊 Data Visualization Studio</h3>
            <p>
              데이터를 효과적인 시각적 표현으로 변환하여 인사이트를 도출합니다.
            </p>
            
            <div style={{ padding: '0 32px' }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                margin: '0 0 12px 0' 
              }}>
                🎨 시각화 옵션
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  📈 통계 차트 및 그래프
                </li>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  📊 인터랙티브 대시보드
                </li>
                <li style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                }}>
                  🗺️ 지리적 히트맵
                </li>
                <li style={{ padding: '8px 0' }}>
                  📉 시계열 분석
                </li>
              </ul>
            </div>
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
          <ToolBar>
            <ToolButton onClick={exportChat}>📁 Export</ToolButton>
            <ToolButton onClick={clearChat}>🗑️ Clear</ToolButton>
          </ToolBar>
        </Header>
        
        <ChatContainer>
          <MessagesArea>
            {messages.map(message => (
              <Message key={message.id} isUser={message.isUser}>
                <MessageWrapper isUser={message.isUser}>
                  {!message.isUser && (
                    <Avatar isUser={false}>AI</Avatar>
                  )}
                  <MessageBubble isUser={message.isUser}>
                    {message.content}
                  </MessageBubble>
                  <MessageTime isUser={message.isUser}>
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </MessageTime>
                </MessageWrapper>
              </Message>
            ))}
            
            {isLoading && (
              <StatusIndicator>
                <ThinkingDots />
                AI가 응답을 생성하고 있습니다...
              </StatusIndicator>
            )}
            
            {isStreaming && (
              <Message isUser={false}>
                <MessageWrapper isUser={false}>
                  <Avatar isUser={false}>AI</Avatar>
                  <MessageBubble isUser={false}>
                    {streamingMessage}<TypingCursor>|</TypingCursor>
                  </MessageBubble>
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
                placeholder={`${agents.find(a => a.id === activeAgent)?.name}에게 메시지를 보내세요...`}
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