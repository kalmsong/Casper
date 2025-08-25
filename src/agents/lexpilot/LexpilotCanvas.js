// src/agents/lexpilot/LexpilotCanvas.js
import React, { useState } from 'react';

const LexpilotCanvas = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: 주소입력, 2: 건축행위, 3: 결과
  const [address, setAddress] = useState('');
  const [addressType, setAddressType] = useState('road'); // road 또는 parcel
  const [buildingUse, setBuildingUse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState('');

  // 건축 행위 옵션들
  const buildingUseOptions = [
    { value: '주택', label: '🏠 주택', description: '단독주택, 공동주택 등' },
    { value: '오피스', label: '🏢 오피스', description: '업무시설' },
    { value: '상가', label: '🏪 상가', description: '근린생활시설, 판매시설' },
    { value: '학교', label: '🏫 학교', description: '교육시설' },
    { value: '호텔', label: '🏨 호텔', description: '숙박시설' },
    { value: '병원', label: '🏥 병원', description: '의료시설' },
    { value: '공장', label: '🏭 공장', description: '공업시설' },
    { value: '기타', label: '🏗️ 기타', description: '기타 건축물' }
  ];

  // 1단계: 토지 정보 조회
  const handleLandInfoSearch = async () => {
    if (!address.trim()) {
      setError('주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/lexpilot/land-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          address_type: addressType
        })
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        landInfo: data
      }));
      
      setCurrentStep(2);
      console.log('✅ 토지 정보 조회 완료:', data);

    } catch (error) {
      console.error('❌ 토지 정보 조회 실패:', error);
      setError(`토지 정보 조회 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2단계: 건축 가능성 및 규제 조회
  const handleBuildingCheck = async () => {
    if (!buildingUse) {
      setError('건축 행위를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 병렬로 두 API 호출
      const [buildableResponse, regulationResponse] = await Promise.all([
        fetch('http://localhost:5001/api/lexpilot/buildable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            address_type: addressType,
            landUseNm: buildingUse
          })
        }),
        fetch('http://localhost:5001/api/lexpilot/regulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            address_type: addressType
          })
        })
      ]);

      if (!buildableResponse.ok || !regulationResponse.ok) {
        throw new Error('법규 조회 중 서버 오류가 발생했습니다.');
      }

      const [buildableData, regulationData] = await Promise.all([
        buildableResponse.json(),
        regulationResponse.json()
      ]);

      setResults(prev => ({
        ...prev,
        buildable: buildableData,
        regulation: regulationData
      }));

      // AI 해석 자동 시작
      await handleAIInterpretation(buildableData, regulationData);

      setCurrentStep(3);
      console.log('✅ 법규 검토 완료');

    } catch (error) {
      console.error('❌ 법규 검토 실패:', error);
      setError(`법규 검토 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // AI 해석 요청
  const handleAIInterpretation = async (buildableData = null, regulationData = null) => {
    setIsInterpreting(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/lexpilot/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          buildingUse: buildingUse,
          landInfo: results?.landInfo,
          buildable: buildableData || results?.buildable,
          regulation: regulationData || results?.regulation
        })
      });

      if (!response.ok) {
        throw new Error('AI 해석 요청 실패');
      }

      const data = await response.json();
      setAiInterpretation(data.interpretation);
      
      console.log('✅ AI 해석 완료');

    } catch (error) {
      console.error('❌ AI 해석 실패:', error);
      setAiInterpretation('AI 해석 중 오류가 발생했습니다. 원본 데이터를 참조해주세요.');
    } finally {
      setIsInterpreting(false);
    }
  };

  // 새로운 검토 시작
  const handleReset = () => {
    setCurrentStep(1);
    setAddress('');
    setAddressType('road');
    setBuildingUse('');
    setResults(null);
    setAiInterpretation('');
    setError('');
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚖️ Lexpilot 법규 검토</h2>
        <p style={styles.subtitle}>
          건축 계획 이전 단계에서 법적 제한을 검토하는 AI Assistant
        </p>
      </div>

      {/* 진행 단계 표시 */}
      <div style={styles.stepIndicator}>
        {[
          { step: 1, title: '토지 정보 조회', icon: '📍' },
          { step: 2, title: '건축 행위 선택', icon: '🏗️' },
          { step: 3, title: '법규 검토 결과', icon: '📋' }
        ].map(({ step, title, icon }) => (
          <div key={step} style={{
            ...styles.stepItem,
            ...(currentStep >= step ? styles.stepActive : {}),
            ...(currentStep === step ? styles.stepCurrent : {})
          }}>
            <div style={styles.stepIcon}>{icon}</div>
            <div style={styles.stepTitle}>{title}</div>
          </div>
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      <div style={styles.content}>
        {/* 1단계: 주소 입력 */}
        {currentStep === 1 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepHeading}>📍 대상지 주소를 입력해주세요</h3>
            <p style={styles.stepDescription}>
              법규 검토를 원하는 건축 대상지의 주소를 정확히 입력해주세요.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>주소 유형</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="road"
                    checked={addressType === 'road'}
                    onChange={(e) => setAddressType(e.target.value)}
                    style={styles.radio}
                  />
                  🛣️ 도로명 주소 (권장)
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="parcel"
                    checked={addressType === 'parcel'}
                    onChange={(e) => setAddressType(e.target.value)}
                    style={styles.radio}
                  />
                  🏠 지번 주소
                </label>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>대상지 주소</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={addressType === 'road' ? 
                  "예: 서울특별시 강남구 테헤란로 123" : 
                  "예: 서울특별시 강남구 역삼동 123-45"
                }
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleLandInfoSearch()}
              />
            </div>

            <button 
              onClick={handleLandInfoSearch}
              disabled={isLoading || !address.trim()}
              style={{
                ...styles.primaryButton,
                ...(isLoading || !address.trim() ? styles.buttonDisabled : {})
              }}
            >
              {isLoading ? '🔍 조회 중...' : '🔍 토지 정보 조회'}
            </button>
          </div>
        )}

        {/* 2단계: 건축 행위 선택 */}
        {currentStep === 2 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepHeading}>🏗️ 건축 행위를 선택해주세요</h3>
            <p style={styles.stepDescription}>
              계획 중인 건축물의 용도를 선택해주세요. 선택한 용도에 따라 관련 법규를 검토합니다.
            </p>

            {/* 토지 정보 요약 */}
            {results?.landInfo && (
              <div style={styles.landSummary}>
                <h4 style={styles.summaryTitle}>📍 대상지 정보</h4>
                <div style={styles.summaryGrid}>
                  <div><strong>주소:</strong> {results.landInfo.address?.road || results.landInfo.address?.jibun}</div>
                  <div><strong>면적:</strong> {results.landInfo.land_info?.landCharacteristics?.lndpcl_ar || 'N/A'}㎡</div>
                  <div><strong>용도지역:</strong> {results.landInfo.land_info?.landCharacteristics?.prpos_area_1_nm || 'N/A'}</div>
                  <div><strong>지목:</strong> {results.landInfo.land_info?.landCharacteristics?.lnm_lndcgr_smbol || 'N/A'}</div>
                </div>
              </div>
            )}

            <div style={styles.buildingUseGrid}>
              {buildingUseOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    console.log('건축용도 선택:', option.value);
                    setBuildingUse(option.value);
                  }}
                  style={{
                    ...styles.buildingUseCard,
                    ...(buildingUse === option.value ? styles.buildingUseCardSelected : {}),
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <div style={styles.buildingUseLabel}>{option.label}</div>
                  <div style={styles.buildingUseDescription}>{option.description}</div>
                </button>
              ))}
            </div>

            <div style={styles.buttonGroup}>
              <button 
                onClick={() => setCurrentStep(1)}
                style={styles.secondaryButton}
              >
                ← 이전 단계
              </button>
              <button 
                onClick={handleBuildingCheck}
                disabled={isLoading || !buildingUse}
                style={{
                  ...styles.primaryButton,
                  ...(isLoading || !buildingUse ? styles.buttonDisabled : {})
                }}
              >
                {isLoading ? '🔍 검토 중...' : '📋 법규 검토 시작'}
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 결과 표시 */}
        {currentStep === 3 && results && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepHeading}>📋 법규 검토 결과</h3>
            
            {/* AI 해석 결과 (우선 표시) */}
            {(aiInterpretation || isInterpreting) && (
              <div style={styles.resultSection}>
                <h4 style={styles.resultTitle}>🤖 AI 법규 해석</h4>
                <div style={styles.interpretationCard}>
                  {isInterpreting ? (
                    <div style={styles.loadingInterpretation}>
                      <div style={styles.loadingSpinner}></div>
                      <span>Claude가 법규 데이터를 분석하고 있습니다...</span>
                    </div>
                  ) : (
                    <div style={styles.interpretationContent}>
                      {aiInterpretation.split('\n').map((line, index) => (
                        <div key={index} style={styles.interpretationLine}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 원본 데이터 (접기/펼치기 가능) */}
            <details style={styles.rawDataDetails}>
              <summary style={styles.rawDataSummary}>📊 원본 데이터 보기</summary>
              
              <div style={styles.resultSection}>
                <h4 style={styles.resultTitle}>🏢 건축 가능성</h4>
                <div style={styles.resultCard}>
                  {results.buildable ? (
                    <div>
                      <div style={styles.buildableStatus}>
                        ✅ 선택하신 용도({buildingUse})에 대한 검토가 완료되었습니다.
                      </div>
                      <div style={styles.resultDetails}>
                        {JSON.stringify(results.buildable, null, 2)}
                      </div>
                    </div>
                  ) : (
                    <div>데이터 로딩 중...</div>
                  )}
                </div>
              </div>

              <div style={styles.resultSection}>
                <h4 style={styles.resultTitle}>⚖️ 규제 법령 정보</h4>
                <div style={styles.resultCard}>
                  {results.regulation ? (
                    <div style={styles.resultDetails}>
                      {JSON.stringify(results.regulation, null, 2)}
                    </div>
                  ) : (
                    <div>데이터 로딩 중...</div>
                  )}
                </div>
              </div>
            </details>

            <div style={styles.buttonGroup}>
              <button 
                onClick={handleReset}
                style={styles.secondaryButton}
              >
                🔄 새로운 검토
              </button>
              <button 
                onClick={() => handleAIInterpretation()}
                disabled={isInterpreting}
                style={{
                  ...styles.secondaryButton,
                  ...(isInterpreting ? styles.buttonDisabled : {})
                }}
              >
                {isInterpreting ? '🔄 해석 중...' : '🤖 AI 해석 새로고침'}
              </button>
              <button 
                onClick={() => {
                  const reportContent = `
법규 검토 보고서
=================

대상지: ${address}
건축 용도: ${buildingUse}
검토 일시: ${new Date().toLocaleString()}

${aiInterpretation || '원본 데이터를 참조해주세요.'}

---
원본 데이터:
${JSON.stringify(results, null, 2)}
                  `.trim();
                  
                  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `법규검토_${address.replace(/[^\w\s]/gi, '_')}_${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={styles.primaryButton}
              >
                📄 보고서 다운로드
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 스타일 정의
const styles = {
  container: {
    height: '100vh',
    overflow: 'auto',
    padding: '24px',
    background: '#f8fafc'
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    color: 'white'
  },

  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0'
  },

  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: 0
  },

  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
    gap: '24px'
  },

  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '12px',
    minWidth: '120px',
    transition: 'all 0.3s ease',
    border: '2px solid #e2e8f0',
    background: '#ffffff'
  },

  stepActive: {
    borderColor: '#3b82f6',
    background: '#eff6ff'
  },

  stepCurrent: {
    borderColor: '#2563eb',
    background: '#dbeafe',
    transform: 'scale(1.05)'
  },

  stepIcon: {
    fontSize: '24px',
    marginBottom: '8px'
  },

  stepTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    color: '#4b5563'
  },

  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },

  stepContent: {
    background: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
  },

  stepHeading: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
    margin: '0 0 8px 0'
  },

  stepDescription: {
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6'
  },

  formGroup: {
    marginBottom: '24px'
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    outline: 'none'
  },

  radioGroup: {
    display: 'flex',
    gap: '16px'
  },

  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#4b5563'
  },

  radio: {
    marginRight: '4px'
  },

  primaryButton: {
    padding: '12px 24px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  },

  secondaryButton: {
    padding: '12px 24px',
    background: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  },

  buttonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },

  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '24px'
  },

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px'
  },

  landSummary: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  },

  summaryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    fontSize: '13px',
    color: '#0f172a'
  },

  buildingUseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '24px'
  },

  buildingUseCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#ffffff',
    textAlign: 'left'
  },

  buildingUseCardSelected: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
  },

  buildingUseLabel: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px'
  },

  buildingUseDescription: {
    fontSize: '13px',
    color: '#6b7280'
  },

  resultSection: {
    marginBottom: '24px'
  },

  resultTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },

  resultCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px'
  },

  buildableStatus: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669',
    marginBottom: '12px'
  },

  resultDetails: {
    fontSize: '12px',
    fontFamily: 'Monaco, "Cascadia Code", monospace',
    color: '#4b5563',
    whiteSpace: 'pre-wrap',
    background: '#ffffff',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    maxHeight: '200px',
    overflow: 'auto'
  },

  // AI 해석 관련 스타일
  interpretationCard: {
    background: '#f0f9ff',
    border: '2px solid #0ea5e9',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },

  loadingInterpretation: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
    padding: '20px',
    fontSize: '14px',
    color: '#0369a1'
  },

  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e0f2fe',
    borderTop: '2px solid #0ea5e9',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  interpretationContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#0f172a'
  },

  interpretationLine: {
    marginBottom: '8px',
    whiteSpace: 'pre-wrap'
  },

  // 원본 데이터 접기/펼치기
  rawDataDetails: {
    marginTop: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },

  rawDataSummary: {
    padding: '12px 16px',
    background: '#f8f9fa',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    userSelect: 'none'
  }
};

export default LexpilotCanvas;