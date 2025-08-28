import React, { useState, useEffect } from 'react';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import DocsChat from './components/DocsChat';
import { queryWithDocs } from '../../services/geminiService';

const INITIAL_URL_GROUPS = [
  {
    id: 'gemini-docs',
    name: 'Gemini API Docs',
    urls: [
      "https://ai.google.dev/gemini-api/docs",
      "https://ai.google.dev/gemini-api/docs/quickstart",
      "https://ai.google.dev/gemini-api/docs/models",
    ]
  },
  {
    id: 'react-docs',
    name: 'React Documentation',
    urls: [
      "https://react.dev/learn",
      "https://react.dev/reference/react",
    ]
  }
];

const DocsCanvas = () => {
  const [urlGroups, setUrlGroups] = useState(INITIAL_URL_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState(INITIAL_URL_GROUPS[0].id);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [knowledgeSource, setKnowledgeSource] = useState('urls'); // 'urls' or 'files'
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeGroup = urlGroups.find(group => group.id === activeGroupId);
  const currentUrls = activeGroup ? activeGroup.urls : [];

  // 그룹 관리 함수들
  const handleAddGroup = (groupName) => {
    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      urls: []
    };
    setUrlGroups(prev => [...prev, newGroup]);
    // 새 그룹을 자동으로 활성화
    setActiveGroupId(newGroup.id);
  };

  const handleDeleteGroup = (groupId) => {
    if (urlGroups.length <= 1) {
      alert('최소 1개의 그룹은 유지해야 합니다.');
      return;
    }
    
    // 삭제할 그룹이 현재 활성 그룹이면 다른 그룹으로 전환
    if (groupId === activeGroupId) {
      const remainingGroups = urlGroups.filter(g => g.id !== groupId);
      if (remainingGroups.length > 0) {
        setActiveGroupId(remainingGroups[0].id);
      }
    }
    
    setUrlGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleRenameGroup = (groupId, newName) => {
    setUrlGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, name: newName } : g
    ));
  };

  // 메시지 전송 처리
  const handleSendMessage = async (query) => {
    if (!query.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const context = knowledgeSource === 'urls' 
        ? { urls: currentUrls }
        : { files: uploadedFiles };

      const response = await queryWithDocs(query, context, isSearchEnabled);
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        urlContext: response.urlContext,
        searchGrounding: response.searchGrounding
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('문서 질의 실패:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: `오류가 발생했습니다: ${error.message}`,
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // URL 관리 함수들
  const handleAddUrl = (url) => {
    setUrlGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeGroupId && !group.urls.includes(url)) {
          return { ...group, urls: [...group.urls, url] };
        }
        return group;
      })
    );
  };

  const handleRemoveUrl = (url) => {
    setUrlGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeGroupId) {
          return { ...group, urls: group.urls.filter(u => u !== url) };
        }
        return group;
      })
    );
  };

  // 파일 관리 함수들
  const handleAddFiles = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      <div style={{ width: '350px', flexShrink: 0 }}>
        <KnowledgeBasePanel
          urlGroups={urlGroups}
          activeGroupId={activeGroupId}
          onSetGroupId={setActiveGroupId}
          currentUrls={currentUrls}
          onAddUrl={handleAddUrl}
          onRemoveUrl={handleRemoveUrl}
          uploadedFiles={uploadedFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          knowledgeSource={knowledgeSource}
          onSetKnowledgeSource={setKnowledgeSource}
          isSearchEnabled={isSearchEnabled}
          onSetIsSearchEnabled={setIsSearchEnabled}
          onAddGroup={handleAddGroup}
          onDeleteGroup={handleDeleteGroup}
          onRenameGroup={handleRenameGroup}
        />
      </div>
      <div style={{ flex: 1 }}>
        <DocsChat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          activeGroupName={activeGroup?.name}
          knowledgeSource={knowledgeSource}
          isSearchEnabled={isSearchEnabled}
        />
      </div>
    </div>
  );
};

export default DocsCanvas;