// src/agents/onboarder/styles/components.js

// 업로드 관련 스타일
export const uploadStyles = {
  fileDropZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    minHeight: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  fileDropZoneActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    transform: 'scale(1.02)'
  },

  dropContent: {
    maxWidth: '300px'
  },

  uploadIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },

  dropTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px'
  },

  dropDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5'
  },

  supportedFormats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center'
  },

  formatLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginRight: '4px'
  },

  formatCode: {
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#374151'
  },

  quickGuide: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  quickGuideTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },

  guideSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  stepText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.4'
  },

  parserList: {
    width: '300px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  parserListHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    borderRadius: '12px 12px 0 0'
  },

  parserListContent: {
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  },

  parserItem: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '8px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },

  parserItemHover: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },

  parserName: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px'
  },

  parserDate: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '8px'
  },

  parserActions: {
    display: 'flex',
    gap: '6px'
  },

  parserButton: {
    padding: '4px 8px',
    fontSize: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  emptyState: {
    textAlign: 'center',
    padding: '32px 16px'
  },

  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },

  emptyStateTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px'
  },

  emptyStateDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: '1.5'
  }
};

// 분석 관련 스타일
export const analysisStyles = {
  apiSelectionPanel: {
    padding: '24px',
    height: '100vh',
    overflow: 'auto',
    backgroundColor: '#ffffff'
  },

  selectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '8px'
  },

  parserTypeSection: {
    marginBottom: '24px'
  },

  parserTypeTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },

  parserTypeOption: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff'
  },

  parserTypeOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },

  optionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px'
  },

  optionDescription: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: '1.4'
  },

  stickyButtonArea: {
    position: 'sticky',
    bottom: '0',
    backgroundColor: '#ffffff',
    padding: '16px 0',
    borderTop: '1px solid #e5e7eb',
    marginTop: '24px'
  },

  continueButton: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },

  // API 키 관련 스타일
  apiKeyContainer: {
    backgroundColor: '#f8fafc',
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
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'white'
  },

  savedKeysList: {
    marginBottom: '16px'
  },

  savedKeysLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },

  savedKeyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '8px'
  },

  expiredKey: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },

  keyInfo: {
    flex: 1
  },

  keyName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  keyMeta: {
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },

  keyDescription: {
    fontStyle: 'italic'
  },

  keyExpiry: {
    // 스타일은 keyMeta에서 상속
  },

  keyActions: {
    display: 'flex',
    gap: '8px'
  },

  keyActionButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s'
  },

  expiredBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.625rem',
    fontWeight: '500'
  },

  noKeysMessage: {
    textAlign: 'center',
    padding: '24px',
    color: '#6b7280'
  },

  noKeysIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },

  noKeysText: {
    fontSize: '0.875rem',
    lineHeight: '1.5'
  },

  // 새 키 추가 폼
  newKeyForm: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px'
  },

  formGroup: {
    marginBottom: '16px'
  },

  formRow: {
    display: 'flex',
    gap: '12px'
  },

  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  },

  formInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s',
    outline: 'none'
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },

  saveKeyButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'white'
  }
};

// 에디터 관련 스타일
export const editorStyles = {
  codeEditor: {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: '"Monaco", "Cascadia Code", "Roboto Mono", "Consolas", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '16px',
    backgroundColor: '#ffffff'
  }
};

// 공통 스타일
export const commonStyles = {
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },

  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff'
  },

  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db'
  },

  dangerButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff'
  },

  successButton: {
    backgroundColor: '#10b981',
    color: '#ffffff'
  }
};