// APIKeyInput.js - 파서별 키 관리에 맞게 간소화

import React, { useState } from 'react';
import { analysisStyles } from '../../styles/components';

const APIKeyInput = ({ onSaveKey, onDeleteKey, savedKeys = [], documentId }) => {
  const [newKey, setNewKey] = useState({
    name: '',
    key: '',
    expiryDate: '',
    description: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSaveKey = async () => {
    // 입력 검증
    if (!newKey.name || !newKey.key) {
      setError('API 키 이름과 키를 입력해주세요.');
      return;
    }

    if (newKey.name.length < 2) {
      setError('API 키 이름은 2자 이상이어야 합니다.');
      return;
    }

    if (newKey.key.length < 10) {
      setError('API 키가 너무 짧습니다. 올바른 키를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // 사용자 입력값 그대로 전달 (키 이름 포함)
      const keyData = {
        name: newKey.name.trim(),      // 사용자가 입력한 이름 그대로
        key: newKey.key.trim(),
        expiryDate: newKey.expiryDate || null,
        description: newKey.description.trim()
      };

      // 부모 컴포넌트의 저장 핸들러 호출
      const result = await onSaveKey(keyData);
      
      console.log('APIKeyInput: 저장 결과 받음:', result);
      
      if (result) {
        setSuccessMessage(`"${newKey.name}" 키가 이 파서에 저장되었습니다!`);
        
        // 폼 리셋
        setNewKey({ name: '', key: '', expiryDate: '', description: '' });
        setIsExpanded(false);
        setError('');
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }

    } catch (error) {
      console.error('API 키 저장 실패:', error);
      setError(error.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 키 삭제 핸들러
  const handleDeleteKey = async (keyId, keyName) => {
    if (!window.confirm(`"${keyName}" 키를 정말 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingKeyId(keyId);
    
    try {
      await onDeleteKey(keyId);
      setSuccessMessage(`"${keyName}" 키가 삭제되었습니다.`);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      setError(error.message || '키 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const isKeyExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return '만료일 없음';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '만료됨';
    if (diffDays === 0) return '오늘 만료';
    if (diffDays <= 7) return `${diffDays}일 후 만료`;
    return date.toLocaleDateString();
  };

  const handleInputChange = (field, value) => {
    setNewKey(prev => ({...prev, [field]: value}));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setNewKey({ name: '', key: '', expiryDate: '', description: '' });
    setError('');
    setSuccessMessage('');
  };

  // 기본 키 이름 제안
  const suggestKeyName = () => {
    if (!newKey.name && documentId) {
      const suggestions = [
        'OpenAI API Key',
        'Claude API Key', 
        'GPT-4 Key',
        'Main API Key'
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    return '';
  };

  return (
    <div style={analysisStyles.apiKeyContainer}>
      <div style={analysisStyles.apiKeyHeader}>
        <h4 style={analysisStyles.apiKeyTitle}>🔑 이 파서의 API 키</h4>
        <button 
          style={{
            ...analysisStyles.addKeyButton,
            backgroundColor: isExpanded ? '#ef4444' : '#3b82f6'
          }}
          onClick={() => isExpanded ? handleCancel() : setIsExpanded(true)}
          disabled={isSaving}
        >
          {isExpanded ? '➖ 취소' : '➕ 키 추가'}
        </button>
      </div>

      {/* 성공 메시지 표시 */}
      {successMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#15803d',
          fontSize: '0.875rem'
        }}>
          ✅ {successMessage}
        </div>
      )}

      {/* 오류 메시지 표시 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 파서별 저장된 키 목록 */}
      {savedKeys.length > 0 && (
        <div style={analysisStyles.savedKeysList}>
          <div style={analysisStyles.savedKeysLabel}>
            이 파서에 저장된 키 ({savedKeys.length}개):
          </div>
          {savedKeys.map(keyData => (
            <div 
              key={keyData.id} 
              style={{
                ...analysisStyles.savedKeyItem,
                ...(isKeyExpired(keyData.expiryDate) ? analysisStyles.expiredKey : {}),
                ...(keyData.isSelected ? { 
                  borderColor: '#3b82f6', 
                  backgroundColor: '#eff6ff' 
                } : {})
              }}
            >
              <div style={analysisStyles.keyInfo}>
                <div style={analysisStyles.keyName}>
                  {keyData.name}
                  {keyData.isSelected && (
                    <span style={{ 
                      background: '#3b82f6',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      사용중
                    </span>
                  )}
                  {keyData.keyPreview && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      marginLeft: '8px',
                      fontFamily: 'monospace'
                    }}>
                      ({keyData.keyPreview})
                    </span>
                  )}
                  {isKeyExpired(keyData.expiryDate) && (
                    <span style={analysisStyles.expiredBadge}>만료됨</span>
                  )}
                </div>
                <div style={analysisStyles.keyMeta}>
                  {keyData.description && (
                    <span style={analysisStyles.keyDescription}>{keyData.description}</span>
                  )}
                  <span style={analysisStyles.keyExpiry}>
                    {keyData.description ? ' • ' : ''}{formatExpiryDate(keyData.expiryDate)}
                  </span>
                </div>
              </div>
              <div style={analysisStyles.keyActions}>
                <button 
                  style={{
                    ...analysisStyles.keyActionButton,
                    opacity: deletingKeyId === keyData.id ? 0.5 : 1,
                    cursor: deletingKeyId === keyData.id ? 'not-allowed' : 'pointer'
                  }}
                  title="삭제"
                  onClick={() => handleDeleteKey(keyData.id, keyData.name)}
                  disabled={deletingKeyId === keyData.id}
                >
                  {deletingKeyId === keyData.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 새 키 추가 폼 */}
      {isExpanded && (
        <div style={analysisStyles.newKeyForm}>
          <div style={analysisStyles.formGroup}>
            <label style={analysisStyles.formLabel}>키 이름 *</label>
            <input
              type="text"
              value={newKey.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={suggestKeyName() || "예: OpenAI API Key"}
              style={{
                ...analysisStyles.formInput,
                borderColor: error && !newKey.name ? '#ef4444' : '#d1d5db'
              }}
              disabled={isSaving}
            />
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginTop: '4px' 
            }}>
              💡 원하는 이름으로 자유롭게 입력하세요
            </div>
          </div>

          <div style={analysisStyles.formGroup}>
            <label style={analysisStyles.formLabel}>API 키 *</label>
            <input
              type="password"
              value={newKey.key}
              onChange={(e) => handleInputChange('key', e.target.value)}
              placeholder="sk-..."
              style={{
                ...analysisStyles.formInput,
                borderColor: error && !newKey.key ? '#ef4444' : '#d1d5db'
              }}
              disabled={isSaving}
            />
          </div>

          <div style={analysisStyles.formRow}>
            <div style={analysisStyles.formGroup}>
              <label style={analysisStyles.formLabel}>만료일 (선택)</label>
              <input
                type="date"
                value={newKey.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                style={analysisStyles.formInput}
                disabled={isSaving}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div style={analysisStyles.formGroup}>
            <label style={analysisStyles.formLabel}>설명 (선택)</label>
            <input
              type="text"
              value={newKey.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="키 용도나 설명을 입력하세요"
              style={analysisStyles.formInput}
              disabled={isSaving}
            />
          </div>

          <div style={analysisStyles.formActions}>
            <button 
              style={{
                ...analysisStyles.saveKeyButton,
                backgroundColor: isSaving ? '#9ca3af' : '#10b981',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
              onClick={handleSaveKey}
              disabled={isSaving || !newKey.name || !newKey.key}
            >
              {isSaving ? '⏳ 저장 중...' : '💾 키 저장'}
            </button>
          </div>
        </div>
      )}

      {savedKeys.length === 0 && !isExpanded && (
        <div style={analysisStyles.noKeysMessage}>
          <div style={analysisStyles.noKeysIcon}>🔐</div>
          <div style={analysisStyles.noKeysText}>
            이 파서에 저장된 API 키가 없습니다.<br />
            키를 추가해서 파서 생성을 계속하세요.
          </div>
        </div>
      )}
    </div>
  );
};

export default APIKeyInput;