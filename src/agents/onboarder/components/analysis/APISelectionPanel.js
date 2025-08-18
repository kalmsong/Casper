// src/agents/onboarder/components/analysis/APISelectionPanel.js (전체 버전)
import React, { useState } from 'react';
import { analysisStyles } from '../../styles/components';
import APIKeyInput from './APIKeyInput';

const APISelectionPanel = ({ 
  analysisResult, 
  onSelectionChange, 
  selectedOption, 
  selectedEndpoints = [], 
  onEndpointToggle, 
  onSelectAll,
  onContinue,
  savedAPIKeys = [],
  onSaveAPIKey,
  onDeleteAPIKey
}) => {
  const [hoveredEndpoint, setHoveredEndpoint] = useState(null);

  const options = [
    {
      id: 'all',
      title: '📋 모든 API 엔드포인트',
      description: '문서에서 발견된 모든 API 엔드포인트를 포함하는 파서를 생성합니다.'
    },
    {
      id: 'custom',
      title: '🎯 커스텀 선택',
      description: '원하는 API만 선택해서 맞춤 파서를 만듭니다.'
    }
  ];

  // API 카테고리별 분류 함수
  const groupEndpointsByCategory = (endpoints) => {
    const groups = {
      auth: { title: '🔐 인증 관련', endpoints: [] },
      user: { title: '👤 사용자 관리', endpoints: [] },
      data: { title: '📊 데이터 관리', endpoints: [] },
      other: { title: '🔧 기타', endpoints: [] }
    };

    endpoints?.forEach(endpoint => {
      const path = endpoint.path.toLowerCase();
      const description = (endpoint.description || '').toLowerCase();
      const category = endpoint.category?.toLowerCase();
      
      if (path.includes('auth') || path.includes('login') || path.includes('token') || 
          description.includes('인증') || description.includes('로그인') || category === 'auth') {
        groups.auth.endpoints.push(endpoint);
      } else if (path.includes('user') || path.includes('profile') || path.includes('member') ||
                 description.includes('사용자') || description.includes('유저') || category === 'user') {
        groups.user.endpoints.push(endpoint);
      } else if (path.includes('data') || path.includes('item') || path.includes('product') ||
                 path.includes('content') || category === 'data') {
        groups.data.endpoints.push(endpoint);
      } else {
        groups.other.endpoints.push(endpoint);
      }
    });

    return groups;
  };

  const endpointGroups = analysisResult?.endpoints ? groupEndpointsByCategory(analysisResult.endpoints) : {};

  const getMethodStyle = (method) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      marginRight: '8px'
    };

    switch (method) {
      case 'GET':
        return { ...baseStyle, backgroundColor: '#dcfdf7', color: '#065f46' };
      case 'POST':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'PUT':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
      case 'DELETE':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // 계속하기 버튼 활성화 조건 체크
  const canContinue = () => {
    if (!selectedOption) return false;
    if (selectedOption === 'custom' && selectedEndpoints.length === 0) return false;
    if (savedAPIKeys.length === 0) return false;
    return true;
  };

  const handleContinue = () => {
    if (!canContinue()) {
      let message = '';
      if (!selectedOption) {
        message = '파서 타입을 선택해주세요.';
      } else if (selectedOption === 'custom' && selectedEndpoints.length === 0) {
        message = '포함할 API를 선택해주세요.';
      } else if (savedAPIKeys.length === 0) {
        message = 'API 키를 먼저 등록해주세요.';
      }
      alert(message);
      return;
    }
    
    onContinue();
  };

  return (
    <div style={analysisStyles.apiSelectionPanel}>
      <h3 style={analysisStyles.selectionTitle}>파서 설정</h3>
      
      {/* API 키 관리 섹션 - 맨 위에 배치 */}
      <APIKeyInput 
        onSaveKey={onSaveAPIKey}
        onDeleteKey={onDeleteAPIKey}
        savedKeys={savedAPIKeys}
      />

      {analysisResult && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            📊 분석 결과
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              발견된 엔드포인트: {analysisResult.endpoints?.length || 0}개
            </div>
            
            {analysisResult.endpoints && (
              <div style={{ 
                maxHeight: '150px', 
                overflow: 'auto',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {analysisResult.endpoints.slice(0, 5).map((endpoint, index) => (
                  <div key={index} style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '0.875rem'
                  }}>
                    <span style={getMethodStyle(endpoint.method)}>
                      {endpoint.method}
                    </span>
                    {endpoint.path}
                    {endpoint.description && (
                      <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '8px' }}>
                        - {endpoint.description}
                      </span>
                    )}
                  </div>
                ))}
                {analysisResult.endpoints.length > 5 && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontStyle: 'italic',
                    color: '#6b7280'
                  }}>
                    ... 외 {analysisResult.endpoints.length - 5}개 더
                  </div>
                )}
              </div>
            )}
          </div>

          {analysisResult.authentication && (
            <div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                인증 방식
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                {analysisResult.authentication}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 파서 타입 선택 옵션 */}
      <div style={analysisStyles.parserTypeSection}>
        <h4 style={analysisStyles.parserTypeTitle}>
          🛠️ 파서 타입 선택
        </h4>
        
        {options.map(option => (
          <div
            key={option.id}
            style={{
              ...analysisStyles.parserTypeOption,
              ...(selectedOption === option.id ? analysisStyles.parserTypeOptionActive : {})
            }}
            onClick={() => onSelectionChange(option.id)}
          >
            <div style={analysisStyles.optionTitle}>
              {option.title}
            </div>
            <div style={analysisStyles.optionDescription}>
              {option.description}
            </div>
          </div>
        ))}
              {/* 커스텀 선택 영역 */}
      {selectedOption === 'custom' && analysisResult?.endpoints && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              포함할 API 선택
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#374151',
                  transition: 'all 0.2s'
                }}
                onClick={() => onSelectAll && onSelectAll(true)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                전체 선택
              </button>
              <button 
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#374151',
                  transition: 'all 0.2s'
                }}
                onClick={() => onSelectAll && onSelectAll(false)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                전체 해제
              </button>
            </div>
          </div>

          {/* 카테고리별 엔드포인트 표시 */}
          {Object.entries(endpointGroups).map(([groupKey, group]) => (
            group.endpoints.length > 0 && (
              <div key={groupKey} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  padding: '4px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {group.title}
                </div>
                {group.endpoints.map((endpoint, index) => {
                  const endpointId = `${endpoint.method}_${endpoint.path}`;
                  const isSelected = selectedEndpoints.includes(endpointId);
                  const isHovered = hoveredEndpoint === endpointId;
                  
                  return (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <label 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          backgroundColor: isHovered ? '#f3f4f6' : 'transparent'
                        }}
                        onMouseEnter={() => setHoveredEndpoint(endpointId)}
                        onMouseLeave={() => setHoveredEndpoint(null)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onEndpointToggle && onEndpointToggle(endpointId, endpoint)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#1f2937',
                            fontWeight: '500'
                          }}>
                            <span style={getMethodStyle(endpoint.method)}>
                              {endpoint.method}
                            </span>
                            {endpoint.path}
                          </div>
                          {endpoint.description && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontStyle: 'italic',
                              marginTop: '2px'
                            }}>
                              {endpoint.description}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )
          ))}

          {selectedEndpoints.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px',
              backgroundColor: '#e0f2fe',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#0369a1'
            }}>
              ✅ 선택된 API: {selectedEndpoints.length}개
            </div>
          )}
        </div>
       )}
      </div>



      {/* 하단 계속하기 버튼 - 조건부 렌더링 및 상태 표시 */}
      <div style={analysisStyles.stickyButtonArea}>
        {!canContinue() && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            ⚠️ {!selectedOption ? '파서 타입을 선택해주세요. ' : ''}
            {selectedOption === 'custom' && selectedEndpoints.length === 0 ? 'API를 선택해주세요. ' : ''}
            {savedAPIKeys.length === 0 ? 'API 키를 등록해주세요.' : ''}
          </div>
        )}
        
        <button 
          style={{
            ...analysisStyles.continueButton,
            ...(canContinue() ? {} : analysisStyles.continueButtonDisabled)
          }}
          onClick={handleContinue}
          disabled={!canContinue()}
        >
          {canContinue() ? '🚀 파서 생성하기' : '⏳ 설정을 완료해주세요'}
        </button>
      </div>
    </div>
  );
};

export default APISelectionPanel;