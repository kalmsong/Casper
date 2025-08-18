// backend/file_processor.js
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

class FileProcessor {
  constructor() {
    this.supportedFormats = ['.pdf', '.docx', '.xlsx', '.xls', '.txt'];
    console.log('📂 FileProcessor 초기화됨');
  }

  isSupportedFormat(filename) {
    const ext = path.extname(filename.toLowerCase());
    const isSupported = this.supportedFormats.includes(ext);
    console.log(`📋 파일 형식 체크: ${filename} (${ext}) - ${isSupported ? '지원됨' : '지원안됨'}`);
    return isSupported;
  }

  async extractText(filePath) {
    console.log(`🔍 텍스트 추출 시작: ${filePath}`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ 파일을 찾을 수 없음: ${filePath}`);
        return {
          success: false,
          text: '',
          metadata: {},
          error: `파일을 찾을 수 없습니다: ${filePath}`
        };
      }

      const filename = path.basename(filePath);
      console.log(`📄 처리할 파일: ${filename}`);

      if (!this.isSupportedFormat(filename)) {
        return {
          success: false,
          text: '',
          metadata: {},
          error: `지원되지 않는 파일 형식입니다: ${filename}`
        };
      }

      const ext = path.extname(filename.toLowerCase());
      console.log(`🔧 파일 처리기 선택: ${ext}`);
      
      switch (ext) {
        case '.pdf':
          return await this._extractPdf(filePath);
        case '.docx':
          return await this._extractDocx(filePath);
        case '.xlsx':
        case '.xls':
          return await this._extractExcel(filePath);
        case '.txt':
          return await this._extractTxt(filePath);
        default:
          return {
            success: false,
            text: '',
            metadata: {},
            error: `처리할 수 없는 파일 형식: ${ext}`
          };
      }
    } catch (error) {
      console.error('❌ 파일 처리 중 오류 발생:', error);
      return {
        success: false,
        text: '',
        metadata: {},
        error: `파일 처리 중 오류: ${error.message}`
      };
    }
  }

  async _extractPdf(filePath) {
    console.log('📖 PDF 처리 시작...');
    try {
      const dataBuffer = fs.readFileSync(filePath);
      console.log(`📊 PDF 파일 크기: ${dataBuffer.length} bytes`);
      
      const data = await pdf(dataBuffer);
      
      const metadata = {
        pages: data.numpages,
        fileType: 'pdf',
        info: data.info || {}
      };

      console.log(`📋 PDF 메타데이터:`, metadata);

      if (!data.text || !data.text.trim()) {
        console.warn('⚠️ PDF에서 텍스트를 추출할 수 없음');
        return {
          success: false,
          text: '',
          metadata: metadata,
          error: 'PDF에서 텍스트를 추출할 수 없습니다'
        };
      }

      console.log(`✅ PDF 처리 완료: ${metadata.pages}페이지, ${data.text.length}자`);

      return {
        success: true,
        text: data.text,
        metadata: metadata,
        error: ''
      };
    } catch (error) {
      console.error('❌ PDF 처리 실패:', error);
      return {
        success: false,
        text: '',
        metadata: { fileType: 'pdf' },
        error: `PDF 처리 실패: ${error.message}`
      };
    }
  }

  async _extractDocx(filePath) {
    console.log('📝 DOCX 처리 시작...');
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      const metadata = {
        fileType: 'docx',
        length: result.value.length,
        messages: result.messages
      };

      console.log(`📋 DOCX 메타데이터:`, metadata);

      if (!result.value || !result.value.trim()) {
        console.warn('⚠️ Word 문서에서 텍스트를 추출할 수 없음');
        return {
          success: false,
          text: '',
          metadata: metadata,
          error: 'Word 문서에서 텍스트를 추출할 수 없습니다'
        };
      }

      console.log(`✅ Word 문서 처리 완료: ${result.value.length}자`);

      return {
        success: true,
        text: result.value,
        metadata: metadata,
        error: ''
      };
    } catch (error) {
      console.error('❌ DOCX 처리 실패:', error);
      return {
        success: false,
        text: '',
        metadata: { fileType: 'docx' },
        error: `Word 문서 처리 실패: ${error.message}`
      };
    }
  }

  async _extractExcel(filePath) {
    console.log('📊 Excel 처리 시작...');
    try {
      const workbook = xlsx.readFile(filePath);
      const textContent = [];
      
      const metadata = {
        sheets: workbook.SheetNames.length,
        fileType: 'excel',
        sheetNames: workbook.SheetNames
      };

      console.log(`📋 Excel 메타데이터:`, metadata);

      for (const sheetName of workbook.SheetNames) {
        try {
          console.log(`📄 시트 처리 중: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          
          textContent.push(`=== Sheet: ${sheetName} ===`);
          
          // 시트를 JSON으로 변환
          const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '' 
          });
          
          if (jsonData.length > 0) {
            // 헤더 추가
            if (jsonData[0]) {
              const headers = jsonData[0].filter(cell => cell !== '').join(' | ');
              if (headers) {
                textContent.push(`Headers: ${headers}`);
              }
            }
            
            // 데이터 추가 (처음 100행만)
            for (let i = 1; i < Math.min(jsonData.length, 101); i++) {
              if (jsonData[i]) {
                const rowText = jsonData[i]
                  .filter(cell => cell !== '')
                  .join(' | ');
                if (rowText.trim()) {
                  textContent.push(rowText);
                }
              }
            }
          }
          
          textContent.push(''); // 시트 간 구분
        } catch (error) {
          console.warn(`⚠️ Excel 시트 '${sheetName}' 처리 중 오류:`, error);
          continue;
        }
      }

      const fullText = textContent.join('\n');

      if (!fullText.trim()) {
        console.warn('⚠️ Excel 파일에서 데이터를 추출할 수 없음');
        return {
          success: false,
          text: '',
          metadata: metadata,
          error: 'Excel 파일에서 데이터를 추출할 수 없습니다'
        };
      }

      console.log(`✅ Excel 파일 처리 완료: ${metadata.sheets}개 시트, ${fullText.length}자`);

      return {
        success: true,
        text: fullText,
        metadata: metadata,
        error: ''
      };
    } catch (error) {
      console.error('❌ Excel 처리 실패:', error);
      return {
        success: false,
        text: '',
        metadata: { fileType: 'excel' },
        error: `Excel 파일 처리 실패: ${error.message}`
      };
    }
  }

  async _extractTxt(filePath) {
    console.log('📄 TXT 처리 시작...');
    try {
      // 여러 인코딩 시도
      const encodings = ['utf8', 'latin1'];
      
      for (const encoding of encodings) {
        try {
          console.log(`🔤 인코딩 시도: ${encoding}`);
          const content = fs.readFileSync(filePath, encoding);
          
          if (content.trim()) {
            const metadata = {
              encoding: encoding,
              lines: content.split('\n').length,
              fileType: 'txt',
              size: content.length
            };
            
            console.log(`✅ 텍스트 파일 처리 완료: ${metadata.lines}줄, ${content.length}자`);
            
            return {
              success: true,
              text: content,
              metadata: metadata,
              error: ''
            };
          }
        } catch (error) {
          console.warn(`⚠️ ${encoding} 인코딩 실패:`, error.message);
          continue;
        }
      }

      console.error('❌ 모든 인코딩 시도 실패');
      return {
        success: false,
        text: '',
        metadata: { fileType: 'txt' },
        error: '텍스트 파일 인코딩을 인식할 수 없습니다'
      };
    } catch (error) {
      console.error('❌ TXT 처리 실패:', error);
      return {
        success: false,
        text: '',
        metadata: { fileType: 'txt' },
        error: `텍스트 파일 처리 실패: ${error.message}`
      };
    }
  }
}

module.exports = { FileProcessor };