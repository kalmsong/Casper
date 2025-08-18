// src/agents/onboarder/components/upload/ParserList.js
import React, { useState } from 'react';
import { uploadStyles } from '../../styles/components';

const ParserList = ({ parsers = [], onSelectParser }) => {
  const [hoveredParser, setHoveredParser] = useState(null);
  
  return (
    <div style={uploadStyles.parserList}>
      <div style={uploadStyles.parserListHeader}>
        🔧 등록된 파서 목록
      </div>
      <div style={uploadStyles.parserListContent}>
        {parsers.map(parser => (
          <div
            key={parser.id}
            style={{
              ...uploadStyles.parserItem,
              ...(hoveredParser === parser.id ? uploadStyles.parserItemHover : {})
            }}
            onMouseEnter={() => setHoveredParser(parser.id)}
            onMouseLeave={() => setHoveredParser(null)}
          >
            <div style={uploadStyles.parserName}>{parser.parserType}</div>
            <div style={uploadStyles.parserDate}>
              {new Date(parser.createdTime).toLocaleDateString()}
            </div>
            <div style={uploadStyles.parserActions}>
              <button 
                style={uploadStyles.parserButton}
                onClick={() => onSelectParser && onSelectParser(parser)}
              >
                👀 보기
              </button>
              <button style={uploadStyles.parserButton}>🚀 사용</button>
            </div>
          </div>
        ))}
        
        {parsers.length === 0 && (
          <div style={uploadStyles.emptyState}>
            <div style={uploadStyles.emptyStateIcon}>🔧</div>
            <div style={uploadStyles.emptyStateTitle}>등록된 파서 없음</div>
            <div style={uploadStyles.emptyStateDescription}>
              문서를 업로드해서<br />
              첫 번째 파서를 만들어보세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParserList;