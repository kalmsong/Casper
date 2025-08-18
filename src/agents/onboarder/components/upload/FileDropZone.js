// src/agents/onboarder/components/upload/FileDropZone.js
import React from 'react';
import { uploadStyles } from '../../styles/components';

const FileDropZone = ({ isDragActive, onClick }) => (
  <div 
    style={{
      ...uploadStyles.fileDropZone,
      ...(isDragActive ? uploadStyles.fileDropZoneActive : {})
    }}
    onClick={onClick}
  >
    <div style={uploadStyles.dropContent}>
      <div style={uploadStyles.uploadIcon}>📄</div>
      <h3 style={uploadStyles.dropTitle}>API 문서 업로드</h3>
      <p style={uploadStyles.dropDescription}>
        {isDragActive 
          ? '파일을 여기에 놓으세요!' 
          : '파일을 드래그하거나 클릭하세요'
        }
      </p>
      <div style={uploadStyles.supportedFormats}>
        <span style={uploadStyles.formatLabel}>지원 형식:</span>
        <code style={uploadStyles.formatCode}>.pdf</code>
        <code style={uploadStyles.formatCode}>.docx</code>
        <code style={uploadStyles.formatCode}>.xlsx</code>
        <code style={uploadStyles.formatCode}>.txt</code>
      </div>
    </div>
  </div>
);

export default FileDropZone;