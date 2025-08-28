import React, { useState, useRef, useEffect } from 'react';
import MessageRenderer from './MessageRenderer';

const DocsChat = ({ 
  messages, 
  onSendMessage, 
  isLoading,
  activeGroupName,
  knowledgeSource,
  isSearchEnabled 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const getPlaceholder = () => {
    if (isSearchEnabled) return "Google Search로 질문하기...";
    if (knowledgeSource === 'urls') return `"${activeGroupName}"에 대해 질문하기...`;
    return "업로드된 파일에 대해 질문하기...";
  };

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputArea: {
      padding: '20px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    form: {
      display: 'flex',
      gap: '12px'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      outline: 'none'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      opacity: isLoading ? 0.5 : 1,
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📖 Documentation Chat</h2>
        <div style={styles.subtitle}>
          {isSearchEnabled 
            ? "Google Search 활성화됨"
            : knowledgeSource === 'urls'
              ? `현재 그룹: ${activeGroupName}`
              : `${messages.length > 0 ? '파일 기반 대화' : '파일을 업로드하여 시작하세요'}`
          }
        </div>
      </div>

      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#9ca3af', 
            marginTop: '40px' 
          }}>
            문서나 파일을 추가하고 질문을 시작하세요
          </div>
        ) : (
          messages.map(message => (
            <MessageRenderer key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            style={styles.input}
          />
          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? '처리중...' : '전송'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocsChat;