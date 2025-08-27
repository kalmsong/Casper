import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './MessageRenderer.css';

// 마크다운 옵션: 엔터 -> <br>, GFM 지원
marked.setOptions({
  gfm: true,
  breaks: true,
});

const MessageRenderer = ({ message }) => {
  const isUser = message?.sender === 'user';
  const isSystem = message?.sender === 'system';

  // 마크다운 → 안전한 HTML
  const html = useMemo(() => {
    const raw = message?.text || '';
    return DOMPurify.sanitize(marked.parse(raw));
  }, [message?.text]);

  const styles = {
    container: {
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      margin: '8px 0',
      padding: '0 8px',
    },
    bubble: {
      maxWidth: '80%',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: isUser ? '#3b82f6' : isSystem ? '#fef3c7' : '#f3f4f6',
      color: isUser ? '#ffffff' : '#1f2937',
      overflowWrap: 'anywhere', // 긴 URL 줄바꿈 보호
    },
    text: {
      fontSize: '14px',
      lineHeight: 1.6,
    },
    sources: {
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(0,0,0,0.08)',
    },
    sourceTitle: {
      fontSize: '12px',
      fontWeight: 600,
      marginBottom: '8px',
      opacity: 0.8,
    },
    sourceList: {
      fontSize: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    sourceLink: {
      color: isUser ? '#ffffff' : '#3b82f6',
      textDecoration: 'none',
      opacity: 0.95,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.bubble}>
        {/* 유저: 생텍스트(개행 유지), 어시스턴트/시스템: 마크다운 HTML */}
        {isUser ? (
          <div style={{ ...styles.text, whiteSpace: 'pre-wrap' }}>{message?.text}</div>
        ) : (
          <div
            className="markdown"
            style={styles.text}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* 참조된 소스 */}
        {message?.urlContext?.length > 0 && (
          <div style={styles.sources}>
            <div style={styles.sourceTitle}>📌 참조된 소스:</div>
            <div style={styles.sourceList}>
              {message.urlContext.map((ctx, idx) => (
                <a
                  key={idx}
                  href={ctx.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.sourceLink}
                >
                  {ctx.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {message?.searchGrounding?.length > 0 && (
          <div style={styles.sources}>
            <div style={styles.sourceTitle}>🔍 검색 결과:</div>
            <div style={styles.sourceList}>
              {message.searchGrounding.map((result, idx) => (
                <a
                  key={idx}
                  href={result.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.sourceLink}
                >
                  {result.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageRenderer;
