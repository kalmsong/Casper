// src/agents/onboarder/styles/components.js

// 업로드 관련 스타일
export const uploadStyles = {
  // 기존 스타일들 유지
  quickGuide: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  
  quickGuideTitle: {
    color: '#1e293b',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 20px 0',
    textAlign: 'center'
  },
  
  guideSteps: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px'
  },
  
  stepNumber: {
    background: '#3b82f6',
    color: 'white',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    flexShrink: 0
  },
  
  stepText: {
    color: '#475569',
    fontSize: '0.875rem',
    lineHeight: '1.4'
  },

  fileDropZone: {
    height: '100%',
    border: '3px dashed #cbd5e1',
    borderRadius: '16px',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '300px',
    cursor: 'pointer'
  },
  
  fileDropZoneActive: {
    borderColor: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.08)',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)'
  },
  
  dropContent: {
    textAlign: 'center',
    padding: '32px'
  },
  
  uploadIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    opacity: '0.8'
  },
  
  dropTitle: {
    color: '#1e293b',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  
  dropDescription: {
    color: '#64748b',
    fontSize: '1rem',
    margin: '0 0 24px 0'
  },
  
  supportedFormats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  
  formatLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
    marginRight: '8px'
  },
  
  formatCode: {
    padding: '4px 8px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#475569',
    margin: '0 4px'
  },

  // 파서 목록 스타일
  parserList: {
    width: '350px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  
  parserListHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  
  parserListContent: {
    flex: 1,
    padding: '16px',
    overflow: 'auto'
  },
  
  parserItem: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '12px',
    background: '#fafafa',
    transition: 'all 0.2s'
  },
  
  parserItemHover: {
    background: '#f1f5f9',
    borderColor: '#3b82f6'
  },
  
  parserName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px'
  },
  
  parserDate: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '8px'
  },
  
  parserActions: {
    display: 'flex',
    gap: '8px'
  },
  
  parserButton: {
    padding: '4px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.2s'
  },

  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    padding: '32px'
  },
  
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  },
  
  emptyStateTitle: {
    fontWeight: '500',
    marginBottom: '8px',
    color: '#4b5563'
  },
  
  emptyStateDescription: {
    fontSize: '13px',
    lineHeight: '1.5'
  }
};

// 분석 관련 스타일
export const analysisStyles = {
  // API 키 관리 스타일
  apiKeyContainer: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },

  apiKeyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  apiKeyTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  addKeyButton: {
    padding: '6px 12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },

  // 저장된 키 목록
  savedKeysList: {
    marginBottom: '16px'
  },

  savedKeysLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },

  savedKeyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '8px'
  },

  expiredKey: {
    background: '#fef2f2',
    borderColor: '#fecaca'
  },

  keyInfo: {
    flex: 1
  },

  keyName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  expiredBadge: {
    background: '#ef4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },

  keyMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.75rem',
    color: '#6b7280'
  },

  keyDescription: {
    fontStyle: 'italic'
  },

  keyExpiry: {
    fontWeight: '500'
  },

  keyActions: {
    display: 'flex',
    gap: '4px'
  },

  keyActionButton: {
    padding: '4px 8px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.2s'
  },

  // 새 키 추가 폼
  newKeyForm: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px'
  },

  formGroup: {
    marginBottom: '16px'
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },

  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },

  formInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },

  saveKeyButton: {
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },

  // 키 없음 메시지
  noKeysMessage: {
    textAlign: 'center',
    padding: '32px',
    color: '#6b7280'
  },

  noKeysIcon: {
    fontSize: '2.5rem',
    marginBottom: '12px',
    opacity: 0.6
  },

  noKeysText: {
    fontSize: '0.875rem',
    lineHeight: '1.5'
  },

  // API 선택 패널 스타일 (스크롤 문제 해결)
  apiSelectionPanel: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100vh', // 최대 높이 설정
    overflow: 'auto'    // 스크롤 가능하도록
  },

  selectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
    textAlign: 'center'
  },

  // 파서 타입 선택 섹션 스타일 추가
  parserTypeSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  parserTypeTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px'
  },

  parserTypeOption: {
    padding: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fafafa'
  },

  parserTypeOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff'
  },

  optionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },

  optionDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: '1.4'
  },

  continueButton: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '24px',
    transition: 'all 0.2s'
  },

  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },

  // 하단 고정 버튼 영역
  stickyButtonArea: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: 'white',
    padding: '16px 0',
    borderTop: '1px solid #e2e8f0',
    marginTop: 'auto', // 자동으로 아래쪽으로 밀어내기
    zIndex: 10
  }
};

// 에디터 관련 스타일
export const editorStyles = {
  // 여기에 코드 에디터 관련 스타일들 추가 예정
};

// 공통 스타일
export const commonStyles = {
  // 여기에 공통 스타일들 추가 예정
};