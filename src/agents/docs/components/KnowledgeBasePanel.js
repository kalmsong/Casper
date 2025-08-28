import React, { useState } from 'react';

const KnowledgeBasePanel = ({
  urlGroups,
  activeGroupId,
  onSetGroupId,
  currentUrls,
  onAddUrl,
  onRemoveUrl,
  uploadedFiles,
  onAddFiles,
  onRemoveFile,
  knowledgeSource,
  onSetKnowledgeSource,
  isSearchEnabled,
  onSetIsSearchEnabled,
  onAddGroup,
  onDeleteGroup,
  onRenameGroup
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // URL 추가 처리
  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      setError('URL을 입력해주세요');
      return;
    }
    try {
      new URL(newUrl);
      onAddUrl(newUrl);
      setNewUrl('');
      setError('');
    } catch {
      setError('올바른 URL 형식이 아닙니다');
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            content: e.target.result
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises).then(results => {
      onAddFiles(results);
    });
  };

  // 그룹 추가 처리
  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName);
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  // 그룹 이름 변경 처리
  const handleRenameGroup = (groupId) => {
    if (editingGroupName.trim()) {
      onRenameGroup(groupId, editingGroupName);
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };

  const styles = {
    container: {
      height: '100%',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#1f2937'
    },
    searchToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px',
      backgroundColor: isSearchEnabled ? '#dbeafe' : '#f3f4f6',
      borderRadius: '8px',
      marginBottom: '16px',
      cursor: 'pointer'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    },
    tab: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    activeTab: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: '#e5e7eb',
      color: '#6b7280'
    },
    groupManager: {
      marginBottom: '16px',
      padding: '12px',
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    groupHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    groupTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151'
    },
    addGroupButton: {
      padding: '4px 8px',
      fontSize: '12px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    groupList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    groupItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px',
      background: '#f8f9fa',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    groupItemActive: {
      background: '#dbeafe',
      borderLeft: '3px solid #3b82f6'
    },
    groupName: {
      flex: 1,
      fontSize: '13px',
      color: '#374151'
    },
    groupActions: {
      display: 'flex',
      gap: '4px'
    },
    iconButton: {
      padding: '4px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      opacity: 0.6,
      transition: 'opacity 0.2s'
    },
    addGroupInput: {
      display: 'flex',
      gap: '4px',
      marginTop: '8px'
    },
    input: {
      flex: 1,
      padding: '6px 10px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '13px'
    },
    button: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
    },
    urlInput: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px'
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    listItem: {
      padding: '8px 12px',
      backgroundColor: 'white',
      borderRadius: '6px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px'
    },
    removeBtn: {
      padding: '4px 8px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      marginBottom: '12px'
    },
    error: {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📚 Knowledge Base</h2>

      <div 
        style={styles.searchToggle}
        onClick={() => onSetIsSearchEnabled(!isSearchEnabled)}
      >
        <input 
          type="checkbox" 
          checked={isSearchEnabled}
          onChange={(e) => onSetIsSearchEnabled(e.target.checked)}
        />
        <label style={{ cursor: 'pointer' }}>Enable Google Search</label>
      </div>

      {!isSearchEnabled && (
        <>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(knowledgeSource === 'urls' ? styles.activeTab : styles.inactiveTab)
              }}
              onClick={() => onSetKnowledgeSource('urls')}
            >
              URLs
            </button>
            <button
              style={{
                ...styles.tab,
                ...(knowledgeSource === 'files' ? styles.activeTab : styles.inactiveTab)
              }}
              onClick={() => onSetKnowledgeSource('files')}
            >
              Files
            </button>
          </div>

          {knowledgeSource === 'urls' ? (
            <>
              {/* 그룹 관리 섹션 */}
              <div style={styles.groupManager}>
                <div style={styles.groupHeader}>
                  <h4 style={styles.groupTitle}>📁 URL 그룹</h4>
                  <button
                    onClick={() => setIsAddingGroup(!isAddingGroup)}
                    style={styles.addGroupButton}
                  >
                    + 새 그룹
                  </button>
                </div>

                <div style={styles.groupList}>
                  {urlGroups.map(group => (
                    <div
                      key={group.id}
                      style={{
                        ...styles.groupItem,
                        ...(activeGroupId === group.id ? styles.groupItemActive : {})
                      }}
                    >
                      {editingGroupId === group.id ? (
                        <>
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleRenameGroup(group.id);
                            }}
                            style={{ ...styles.input, flex: 1, marginRight: '4px' }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameGroup(group.id)}
                            style={{ ...styles.iconButton, color: '#10b981' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroupId(null);
                              setEditingGroupName('');
                            }}
                            style={{ ...styles.iconButton, color: '#ef4444' }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            style={styles.groupName}
                            onClick={() => onSetGroupId(group.id)}
                          >
                            {group.name} ({group.urls.length})
                          </div>
                          <div style={styles.groupActions}>
                            <button
                              style={styles.iconButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGroupId(group.id);
                                setEditingGroupName(group.name);
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.6}
                            >
                              ✏️
                            </button>
                            <button
                              style={styles.iconButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`)) {
                                  onDeleteGroup(group.id);
                                }
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.6}
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {isAddingGroup && (
                  <div style={styles.addGroupInput}>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="새 그룹 이름"
                      style={styles.input}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddGroup();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleAddGroup}
                      style={{ ...styles.button, fontSize: '12px' }}
                    >
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingGroup(false);
                        setNewGroupName('');
                      }}
                      style={{ 
                        ...styles.button, 
                        backgroundColor: '#ef4444',
                        fontSize: '12px'
                      }}
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>

              {/* URL 추가 섹션 */}
              <div style={styles.urlInput}>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/docs"
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
                />
                <button onClick={handleAddUrl} style={styles.button}>
                  추가
                </button>
              </div>
              {error && <div style={styles.error}>{error}</div>}

              {/* URL 목록 */}
              <div style={styles.list}>
                {currentUrls.length > 0 ? (
                  currentUrls.map(url => (
                    <div key={url} style={styles.listItem}>
                      <a href={url} target="_blank" rel="noopener noreferrer" 
                         style={{ color: '#3b82f6', textDecoration: 'none', flex: 1 }}>
                        {url}
                      </a>
                      <button
                        onClick={() => onRemoveUrl(url)}
                        style={styles.removeBtn}
                      >
                        삭제
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#9ca3af', 
                    padding: '20px',
                    fontSize: '14px'
                  }}>
                    이 그룹에 URL을 추가하세요
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 파일 업로드 섹션 */}
              <div style={styles.uploadArea}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="file-upload"
                  accept=".txt,.md,.json,.js,.ts,.html,.css,.pdf,.docx,.xlsx"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  📁 클릭하여 파일 업로드
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    지원: .txt, .md, .json, .pdf, .docx, .xlsx
                  </div>
                </label>
              </div>

              <div style={styles.list}>
                {uploadedFiles.length > 0 ? (
                  uploadedFiles.map(file => (
                    <div key={file.name} style={styles.listItem}>
                      <span>📄 {file.name}</span>
                      <button
                        onClick={() => onRemoveFile(file.name)}
                        style={styles.removeBtn}
                      >
                        삭제
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#9ca3af', 
                    padding: '20px',
                    fontSize: '14px'
                  }}>
                    파일을 업로드하세요
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgeBasePanel;