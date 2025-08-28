// Gemini API 서비스 (백엔드 연동 버전)
export const queryWithDocs = async (query, context, useSearch) => {
  try {
    const response = await fetch('http://localhost:5001/api/docs/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        useSearch
      })
    });

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Gemini 서비스 오류:', error);
    // 백엔드 없이 동작하는 폴백
    return {
      text: `[시뮬레이션 응답] "${query}"에 대한 응답입니다. 실제 Gemini API 연동을 위해서는 백엔드 설정이 필요합니다.`,
      urlContext: context.urls ? context.urls.map(url => ({ url, status: 'SUCCESS' })) : [],
      searchGrounding: []
    };
  }
};