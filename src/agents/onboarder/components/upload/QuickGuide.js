// src/agents/onboarder/components/upload/QuickGuide.js
import React from 'react';
import { uploadStyles } from '../../styles/components';

const QuickGuide = () => (
  <div style={uploadStyles.quickGuide}>
    <h3 style={uploadStyles.quickGuideTitle}>💡 API Hub 사용 가이드</h3>
    <div style={uploadStyles.guideSteps}>
      <div style={uploadStyles.step}>
        <span style={uploadStyles.stepNumber}>1</span>
        <span style={uploadStyles.stepText}>API 문서를 업로드하거나 기존 파서를 선택하세요</span>
      </div>
      <div style={uploadStyles.step}>
        <span style={uploadStyles.stepNumber}>2</span>
        <span style={uploadStyles.stepText}>AI와 설정하기 버튼을 클릭하세요</span>
      </div>
      <div style={uploadStyles.step}>
        <span style={uploadStyles.stepNumber}>3</span>
        <span style={uploadStyles.stepText}>API 키를 입력하고 파서 옵션을 설정하세요</span>
      </div>
      <div style={uploadStyles.step}>
        <span style={uploadStyles.stepNumber}>4</span>
        <span style={uploadStyles.stepText}>테스트 후 파서를 등록하세요</span>
      </div>
    </div>
  </div>
);

export default QuickGuide;