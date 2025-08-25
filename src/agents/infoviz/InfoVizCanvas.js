import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';

const InfoVizCanvas = ({ onSendMessage, onDataUpdate }) => {
  // State variables
  const [apiUrl, setApiUrl] = useState('');
  const [rawData, setRawData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [chartType, setChartType] = useState('');
  const [selectedXField, setSelectedXField] = useState(null);
  const [selectedYField, setSelectedYField] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const rowsPerPage = 10;
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // ===== DATA PARSING UTILITIES =====
  const parseApiResponse = (rawData, contentType = '') => {
    try {
      if (typeof rawData === 'object' && rawData !== null) {
        return parseJsonData(rawData);
      }
      
      if (typeof rawData === 'string') {
        if (rawData.trim().startsWith('<') || contentType.includes('xml')) {
          return parseXmlData(rawData);
        }
        
        try {
          const jsonData = JSON.parse(rawData);
          return parseJsonData(jsonData);
        } catch {
          return parseTextData(rawData);
        }
      }
      
      throw new Error('Unsupported data format');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fields: [],
        rows: [],
        summary: 'Data parsing failed'
      };
    }
  };

  const parseJsonData = (data) => {
    if (Array.isArray(data)) {
      // KOSIS 데이터 구조인지 확인
      if (data.length > 0 && data[0].hasOwnProperty('C1_NM') && data[0].hasOwnProperty('DT')) {
        return parseKosisData(data);
      }
      return parseArrayData(data);
    }
    
    if (typeof data === 'object') {
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      
      if (arrayKeys.length > 0) {
        const mainArrayKey = arrayKeys.reduce((a, b) => 
          data[a].length > data[b].length ? a : b
        );
        
        return {
          ...parseArrayData(data[mainArrayKey]),
          metadata: {
            mainDataKey: mainArrayKey,
            totalKeys: Object.keys(data).length
          }
        };
      }
      
      return parseObjectData(data);
    }
    
    throw new Error('Cannot analyze JSON structure');
  };

  // KOSIS 전용 파싱 함수 추가
  const parseKosisData = (kosisArray) => {
    console.log('📊 KOSIS 데이터 파싱 중...');
    
    // KOSIS 데이터에서 의미있는 필드만 추출
    const meaningfulFields = ['C1_NM', 'C2_NM', 'DT', 'PRD_DE', 'UNIT_NM'];
    const friendlyHeaders = ['지역', '연령대', '인구수', '연도', '단위'];
    
    const rows = kosisArray.map(item => [
      item.C1_NM || '',           // 지역
      item.C2_NM || '',           // 연령대  
      item.DT || '',              // 인구수
      item.PRD_DE || '',          // 연도
      item.UNIT_NM || ''          // 단위
    ]);
    
    // 필드 타입 분석
    const fieldTypes = {
      '지역': 'text',
      '연령대': 'text', 
      '인구수': 'number',
      '연도': 'date',
      '단위': 'text'
    };
    
    return {
      success: true,
      dataType: 'KOSIS',
      fields: friendlyHeaders,
      rows: rows,
      summary: `${kosisArray[0]?.TBL_NM || 'KOSIS 통계 데이터'} (${rows.length}개 항목)`,
      metadata: {
        totalRows: rows.length,
        sampleSize: rows.length,
        hasData: true,
        fieldTypes: fieldTypes,
        originalTableName: kosisArray[0]?.TBL_NM,
        dataSource: 'KOSIS'
      }
    };
  };

  const parseArrayData = (arrayData) => {
    if (arrayData.length === 0) {
      return {
        success: true,
        fields: [],
        rows: [],
        summary: 'Empty array',
        metadata: { hasData: false }
      };
    }
    
    const firstItem = arrayData[0];
    const fields = extractFields(firstItem);
    const rows = arrayData.slice(0, 100).map(item => extractRowValues(item, fields));
    const fieldTypes = analyzeFieldTypes(arrayData.slice(0, 10), fields);
    
    return {
      success: true,
      dataType: 'Array',
      fields: fields,
      rows: rows,
      summary: `${arrayData.length} items array data`,
      metadata: {
        totalRows: arrayData.length,
        sampleSize: Math.min(100, arrayData.length),
        hasData: true,
        fieldTypes: fieldTypes
      }
    };
  };

  const parseObjectData = (objectData) => {
    const entries = Object.entries(objectData).slice(0, 50);
    
    return {
      success: true,
      dataType: 'Object',
      fields: ['Key', 'Value'],
      rows: entries.map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]),
      summary: `Object with ${Object.keys(objectData).length} properties`,
      metadata: {
        totalRows: Object.keys(objectData).length,
        hasData: true,
        fieldTypes: { 'Key': 'text', 'Value': 'mixed' }
      }
    };
  };

  const parseXmlData = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('XML parsing error');
      }
      
      // Extract text content from XML elements
      const elements = xmlDoc.getElementsByTagName('*');
      const rows = [];
      const fieldSet = new Set();
      
      for (let i = 0; i < Math.min(elements.length, 50); i++) {
        const element = elements[i];
        if (element.children.length === 0 && element.textContent.trim()) {
          fieldSet.add(element.tagName);
          rows.push([element.tagName, element.textContent.trim()]);
        }
      }
      
      return {
        success: true,
        dataType: 'XML',
        fields: ['Element', 'Value'],
        rows: rows,
        summary: `XML document with ${elements.length} elements`,
        metadata: {
          totalRows: rows.length,
          hasData: rows.length > 0,
          fieldTypes: { 'Element': 'text', 'Value': 'mixed' }
        }
      };
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  };

  const parseTextData = (textData) => {
    const lines = textData.split('\n').filter(line => line.trim()).slice(0, 50);
    
    return {
      success: true,
      dataType: 'Text',
      fields: ['Line'],
      rows: lines.map((line, index) => [`Line ${index + 1}: ${line.substring(0, 100)}`]),
      summary: `Text data with ${lines.length} lines`,
      metadata: {
        totalRows: lines.length,
        hasData: lines.length > 0,
        fieldTypes: { 'Line': 'text' }
      }
    };
  };

  const extractFields = (item) => {
    if (typeof item === 'object' && item !== null) {
      return Object.keys(item);
    }
    return ['Value'];
  };

  const extractRowValues = (item, fields) => {
    if (typeof item === 'object' && item !== null) {
      return fields.map(field => {
        const value = item[field];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      });
    }
    return [String(item)];
  };

  const analyzeFieldTypes = (sampleData, fields) => {
    const types = {};
    
    fields.forEach(field => {
      const values = sampleData.map(item => item[field]).filter(v => v != null);
      
      if (values.length === 0) {
        types[field] = 'unknown';
        return;
      }
      
      if (values.every(v => !isNaN(Number(v)) && v !== '')) {
        types[field] = 'number';
      } else if (values.some(v => isDateLike(String(v)))) {
        types[field] = 'date';
      } else {
        types[field] = 'text';
      }
    });
    
    return types;
  };

  const isDateLike = (str) => {
    const datePatterns = [
      /^\d{4}$/,
      /^\d{4}-\d{2}$/,
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{4}년$/,
      /^\d{4}년 \d{1,2}월$/
    ];
    
    return datePatterns.some(pattern => pattern.test(str.trim()));
  };

  const convertToChartData = (parsedResult, xField, yField) => {
    if (!parsedResult.success || !parsedResult.rows) {
      return [];
    }
    
    const xIndex = parsedResult.fields.indexOf(xField);
    const yIndex = parsedResult.fields.indexOf(yField);
    
    if (xIndex === -1 || yIndex === -1) {
      return [];
    }
    
    return parsedResult.rows
      .map(row => ({
        name: row[xIndex] || '',
        value: parseNumericValue(row[yIndex]) || 0,
        originalX: row[xIndex],
        originalY: row[yIndex]
      }))
      .filter(item => item.name && !isNaN(item.value))
      .slice(0, 50);
  };

  const parseNumericValue = (str) => {
    if (typeof str === 'number') return str;
    
    const cleaned = String(str).replace(/[,%]/g, '').trim();
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? 0 : num;
  };

  // ===== AI ANALYSIS =====
  const analyzeDataWithAI = async (parsed) => {
    try {
      const dataSummary = createDataSummary(parsed);
      const prompt = createAnalysisPrompt(dataSummary);
      
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          agent: 'infoviz',
          history: []
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Auto-suggest axis based on field types
        const textField = parsed.fields.find(field => 
          parsed.metadata?.fieldTypes?.[field] === 'text' || 
          parsed.metadata?.fieldTypes?.[field] === 'date'
        ) || parsed.fields[0];
        
        const numberField = parsed.fields.find(field => 
          parsed.metadata?.fieldTypes?.[field] === 'number'
        ) || parsed.fields[1] || parsed.fields[0];
        
        if (textField && numberField && textField !== numberField) {
          setSelectedXField(textField);
          setSelectedYField(numberField);
        }
        
        if (onSendMessage) {
          onSendMessage(`🤖 AI 데이터 분석 완료!\n\n${result.response}\n\n📋 아래 표에서 X축, Y축을 선택하고 차트를 생성해보세요!\n\n💡 추천: X축(${textField}), Y축(${numberField})`);
        }
      }
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      if (onSendMessage) {
        onSendMessage(`⚠️ AI 분석 중 오류가 발생했습니다.\n\n📋 표에서 직접 X축, Y축을 선택해서 차트를 만들어보세요.`);
      }
    }
  };

  const createDataSummary = (parsedData) => {
    const { fields, rows, metadata } = parsedData;
    
    // KOSIS 데이터인 경우
    if (metadata?.dataSource === 'KOSIS') {
      return {
        dataType: 'KOSIS',
        totalRows: metadata?.totalRows || 0,
        totalFields: fields.length,
        originalTableName: metadata?.originalTableName,
        sampleRows: rows.slice(0, 10) // KOSIS는 더 많은 샘플 표시
      };
    }
    
    // 일반 데이터인 경우
    return {
      dataType: parsedData.dataType,
      totalRows: metadata?.totalRows || 0,
      totalFields: fields.length,
      fields: fields.map(field => ({
        name: field,
        type: metadata?.fieldTypes?.[field] || 'unknown',
        samples: rows.slice(0, 3).map(row => {
          const fieldIndex = fields.indexOf(field);
          return row[fieldIndex];
        }).filter(v => v && v.trim())
      })),
      sampleRows: rows.slice(0, 5)
    };
  };

  const createAnalysisPrompt = (dataSummary) => {
    // KOSIS 데이터인지 확인
    if (dataSummary.fields.includes('지역') && dataSummary.fields.includes('인구수')) {
      return `다음은 KOSIS(통계청) 인구 통계 데이터입니다:

📊 **데이터 정보:**
- 제목: ${dataSummary.originalTableName || '인구 통계'}
- 총 ${dataSummary.totalRows}개 데이터 포인트
- 지역별 연령대별 인구 현황

📋 **주요 필드:**
- 지역: ${dataSummary.sampleRows.map(row => row[0]).slice(0, 3).join(', ')}...
- 연령대: ${dataSummary.sampleRows.map(row => row[1]).slice(0, 3).join(', ')}...  
- 인구수: ${dataSummary.sampleRows.map(row => row[2]).slice(0, 3).join(', ')}...
- 연도: ${dataSummary.sampleRows.map(row => row[3]).slice(0, 3).join(', ')}...

🔍 **샘플 데이터:**
${dataSummary.sampleRows.slice(0, 5).map((row, idx) => 
  `${idx + 1}. ${row[0]} ${row[1]} 연령대: ${Number(row[2]).toLocaleString()}${row[4]} (${row[3]}년)`
).join('\n')}

이 인구 통계 데이터로 어떤 차트를 만들면 좋을지 추천해주세요:
1. 지역별 인구 비교
2. 연령대별 인구 분포  
3. 연도별 인구 변화 추이

사람이 이해하기 쉽게 설명해주세요.`;
    }
    
    // 일반 데이터용 기존 프롬프트
    return `다음 데이터를 분석해서 사람이 이해하기 쉽게 설명해주세요:

📊 **데이터 정보:**
- 데이터 타입: ${dataSummary.dataType}
- 총 ${dataSummary.totalRows}개 행, ${dataSummary.totalFields}개 열

📋 **필드 정보:**
${dataSummary.fields.map(field => 
  `• ${field.name} (${field.type}): 예시값 [${field.samples.join(', ')}]`
).join('\n')}

🔍 **샘플 데이터:**
${dataSummary.sampleRows.map((row, idx) => 
  `${idx + 1}행: ${row.join(' | ')}`
).join('\n')}

이 데이터가 무엇인지 한국어로 쉽게 설명하고, 시각화하기 좋은 차트 3개를 추천해주세요. JSON이나 기술용어 말고 일반인이 이해할 수 있는 설명으로 부탁드립니다.`;
  };

  // ===== API DATA FETCHING =====
  const fetchApiData = async () => {
    if (!apiUrl.trim()) {
      if (onSendMessage) {
        onSendMessage('❌ API URL을 입력해주세요.');
      }
      return;
    }

    try {
      setIsLoadingData(true);
      
      if (onSendMessage) {
        onSendMessage(`🌐 API 데이터 가져오는 중...\nURL: ${apiUrl.substring(0, 100)}...`);
      }
      
      const proxyUrl = `http://localhost:8000/proxy?url=${encodeURIComponent(apiUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setRawData(result.data);
        
        const parsed = parseApiResponse(result.data, result.metadata?.content_type);
        setParsedData(parsed);
        
        if (parsed.success) {
          if (onSendMessage) {
            onSendMessage(`✅ 데이터 파싱 성공!\n\n📊 **${parsed.summary}**\n• ${parsed.fields.length}개 필드\n• ${parsed.metadata?.totalRows || 0}개 행\n\n🤖 AI가 데이터를 분석하고 있습니다...`);
          }
          
          await analyzeDataWithAI(parsed);
        } else {
          if (onSendMessage) {
            onSendMessage(`⚠️ 데이터 파싱 실패: ${parsed.error}`);
          }
        }
      } else {
        throw new Error('프록시에서 데이터를 가져올 수 없습니다.');
      }
      
    } catch (error) {
      console.error('API 데이터 가져오기 실패:', error);
      
      if (onSendMessage) {
        onSendMessage(`❌ 데이터 가져오기 실패: ${error.message}\n\n💡 해결 방법:\n1. FastAPI 프록시 서버(포트 8000) 실행 확인\n2. API URL 확인\n3. 네트워크 연결 확인`);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // ===== TABLE UTILITIES =====
  const getFieldTypeIcon = (field) => {
    const fieldType = parsedData?.metadata?.fieldTypes?.[field];
    switch (fieldType) {
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'text': return '📝';
      default: return '❓';
    }
  };

  const isFieldSelectable = (field, axis) => {
    const fieldType = parsedData?.metadata?.fieldTypes?.[field];
    
    if (axis === 'x') {
      return fieldType === 'text' || fieldType === 'date';
    } else {
      return fieldType === 'number';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!parsedData?.rows || !sortField) return parsedData?.rows || [];
    
    const fieldIndex = parsedData.fields.indexOf(sortField);
    if (fieldIndex === -1) return parsedData.rows;

    const sorted = [...parsedData.rows].sort((a, b) => {
      const aVal = a[fieldIndex] || '';
      const bVal = b[fieldIndex] || '';
      
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
    
    return sorted;
  };

  const getPaginatedData = () => {
    const sortedData = getSortedData();
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  };

  // ===== CHART UTILITIES =====
  const formatNumber = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return value;
    
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    
    if (value % 1 === 0) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
            {selectedXField}: {label}
          </div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color }}>
              {selectedYField}: {formatNumber(entry.value)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '1.125rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div>표에서 X축과 Y축을 선택해주세요</div>
          </div>
        </div>
      );
    }

    const commonProps = { width: '100%', height: '100%' };
    const margin = { top: 20, right: 30, left: 20, bottom: 60 };

    switch (chartType) {
      case 'LineChart':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 80 : 60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ r: 5 }}
                name={selectedYField}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'BarChart':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={chartData.length > 8 ? -45 : 0}
                textAnchor={chartData.length > 8 ? 'end' : 'middle'}
                height={chartData.length > 8 ? 80 : 60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name={selectedYField} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'PieChart':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(1)}%` : ''}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatNumber(value), selectedYField]}
                labelFormatter={(label) => `${selectedXField}: ${label}`}
              />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'AreaChart':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData} margin={margin}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 80 : 60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorArea)"
                strokeWidth={2}
                name={selectedYField}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  // ===== EVENT HANDLERS =====
  const handleFieldSelect = (xField, yField) => {
    setSelectedXField(xField);
    setSelectedYField(yField);
    
    if (xField && yField && parsedData) {
      const newChartData = convertToChartData(parsedData, xField, yField);
      setChartData(newChartData);
      
      if (!chartType) {
        setChartType('BarChart');
      }
      
      if (onSendMessage) {
        onSendMessage(`✅ 축 선택 완료!\nX축: ${xField}\nY축: ${yField}\n\n${newChartData.length}개 데이터 포인트로 차트를 생성했습니다.`);
      }
    }
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
    
    if (onSendMessage) {
      const chartNames = {
        'LineChart': '📈 라인 차트',
        'BarChart': '📊 막대 차트',
        'PieChart': '🥧 파이 차트',
        'AreaChart': '📊 영역 차트'
      };
      
      onSendMessage(`${chartNames[type]}로 변경했습니다!`);
    }
  };

  // Global functions for external control
  useEffect(() => {
    window.InfoVizActions = {
      fetchData: fetchApiData,
      selectChart: handleChartTypeChange,
      getRawData: () => rawData,
      getParsedData: () => parsedData
    };
    
    return () => {
      delete window.InfoVizActions;
    };
  }, [apiUrl, rawData, parsedData]);

  // ===== RENDER =====
  const totalPages = Math.ceil((parsedData?.rows?.length || 0) / rowsPerPage);
  const paginatedData = getPaginatedData();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      
      {/* Header: API URL Input */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          color: '#1f2937' 
        }}>
          📊 Data Visualization Studio
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '6px' 
            }}>
              🌐 API URL:
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/data or paste your JSON URL"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
              onKeyPress={(e) => e.key === 'Enter' && fetchApiData()}
            />
          </div>
          <button
            onClick={fetchApiData}
            disabled={isLoadingData}
            style={{
              padding: '10px 20px',
              background: isLoadingData ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoadingData ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {isLoadingData ? '📡 Loading...' : '🚀 Fetch Data'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Data Table Section */}
        {parsedData && parsedData.success && (
          <div style={{ 
            height: '40%', 
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            overflow: 'auto'
          }}>
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              
              {/* Table Header Info */}
              <div style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937' 
                  }}>
                    📋 {parsedData.summary}
                  </h4>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '0.875rem', 
                    color: '#6b7280' 
                  }}>
                    Total {parsedData.metadata?.totalRows || 0} rows • {parsedData.fields?.length || 0} columns
                  </p>
                </div>
                
                {/* Axis Selection Display */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>X-axis: </span>
                    <span style={{ 
                      color: selectedXField ? '#059669' : '#9ca3af',
                      fontWeight: selectedXField ? '600' : '400'
                    }}>
                      {selectedXField || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Y-axis: </span>
                    <span style={{ 
                      color: selectedYField ? '#dc2626' : '#9ca3af',
                      fontWeight: selectedYField ? '600' : '400'
                    }}>
                      {selectedYField || 'Not selected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {parsedData.fields?.map((field, index) => (
                        <th
                          key={index}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #e5e7eb',
                            textAlign: 'left',
                            cursor: 'pointer',
                            position: 'relative',
                            minWidth: '120px'
                          }}
                          onClick={() => handleSort(field)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{getFieldTypeIcon(field)}</span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: '#1f2937',
                              fontSize: '0.8rem'
                            }}>
                              {field}
                            </span>
                            {sortField === field && (
                              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          
                          {/* Axis Selection Buttons */}
                          <div style={{ 
                            marginTop: '6px', 
                            display: 'flex', 
                            gap: '4px' 
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldSelect(field, selectedYField);
                              }}
                              disabled={!isFieldSelectable(field, 'x')}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.6rem',
                                border: selectedXField === field ? '1px solid #059669' : '1px solid #d1d5db',
                                background: selectedXField === field ? '#ecfdf5' : '#ffffff',
                                color: selectedXField === field ? '#059669' : isFieldSelectable(field, 'x') ? '#6b7280' : '#d1d5db',
                                borderRadius: '3px',
                                cursor: isFieldSelectable(field, 'x') ? 'pointer' : 'not-allowed'
                              }}
                            >
                              X-axis
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldSelect(selectedXField, field);
                              }}
                              disabled={!isFieldSelectable(field, 'y')}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.6rem',
                                border: selectedYField === field ? '1px solid #dc2626' : '1px solid #d1d5db',
                                background: selectedYField === field ? '#fef2f2' : '#ffffff',
                                color: selectedYField === field ? '#dc2626' : isFieldSelectable(field, 'y') ? '#6b7280' : '#d1d5db',
                                borderRadius: '3px',
                                cursor: isFieldSelectable(field, 'y') ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Y-axis
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex}
                        style={{ 
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            style={{
                              padding: '10px 16px',
                              color: '#374151',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#9ca3af' : '#374151'
                    }}
                  >
                    Previous
                  </button>
                  
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div style={{ 
          flex: 1, 
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {chartData.length > 0 && selectedXField && selectedYField ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Chart Controls */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px',
                flexShrink: 0
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: '#1f2937' 
                }}>
                  📈 {chartType?.replace('Chart', '')} Chart
                </h4>
                
                {/* Chart Type Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { type: 'LineChart', icon: '📈', name: 'Line' },
                    { type: 'BarChart', icon: '📊', name: 'Bar' },
                    { type: 'PieChart', icon: '🥧', name: 'Pie' },
                    { type: 'AreaChart', icon: '📊', name: 'Area' }
                  ].map(({ type, icon, name }) => (
                    <button
                      key={type}
                      onClick={() => handleChartTypeChange(type)}
                      style={{
                        padding: '8px 12px',
                        background: chartType === type ? '#3b82f6' : '#ffffff',
                        color: chartType === type ? '#ffffff' : '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{icon}</span>
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Container */}
              <div style={{ 
                flex: 1, 
                background: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px', 
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                minHeight: '300px'
              }}>
                {renderChart()}
              </div>

              {/* Chart Info */}
              <div style={{ 
                marginTop: '12px',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  X-axis: {selectedXField} | Y-axis: {selectedYField}
                </span>
                <span>
                  {chartData.length} data points
                </span>
              </div>
            </div>
          ) : (
            // Initial State or No Data
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              color: '#6b7280',
              fontSize: '1.125rem',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              {!parsedData ? (
                <div>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    Fetch API data to get started!
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    Enter an API URL above and click "Fetch Data".<br/>
                    AI will analyze the data and recommend the best charts!
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    Select X-axis and Y-axis from the table
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    {!selectedXField && '• X-axis: Select a text or date field'}<br/>
                    {!selectedYField && '• Y-axis: Select a number field'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoVizCanvas;