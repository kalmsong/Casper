# fixed_proxy_server.py - 안정적인 버전
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import json

# FastAPI 앱 생성
app = FastAPI(title="API Proxy Server", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Proxy Server is running", "status": "OK"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api-proxy"}

@app.get("/proxy")
def proxy_get_request(url: str = Query(..., description="Target API URL")):
    """GET 요청 프록시"""
    try:
        print(f"🌐 프록시 요청: {url}")
        
        # requests로 API 호출
        response = requests.get(url, timeout=30)
        print(f"✅ 응답 상태: {response.status_code}")
        print(f"📄 Content-Type: {response.headers.get('content-type', 'unknown')}")
        
        # 응답 데이터 처리
        try:
            # JSON 파싱 시도
            json_data = response.json()
            return {
                "success": True,
                "status_code": response.status_code,
                "data": json_data,
                "metadata": {
                    "url": url,
                    "content_type": response.headers.get("content-type"),
                    "size": len(response.content)
                }
            }
        except json.JSONDecodeError:
            # JSON이 아닌 경우 텍스트로 반환
            print("⚠️ JSON 파싱 실패, 텍스트로 반환")
            return {
                "success": True,
                "status_code": response.status_code,
                "data": response.text,
                "metadata": {
                    "url": url,
                    "content_type": response.headers.get("content-type"),
                    "size": len(response.content),
                    "note": "Returned as text (not JSON)"
                }
            }
            
    except requests.exceptions.Timeout:
        print("❌ 요청 타임아웃")
        raise HTTPException(status_code=408, detail="Request timeout")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ 요청 실패: {e}")
        raise HTTPException(status_code=400, detail=f"Request failed: {str(e)}")
    
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/test")
def test_proxy():
    """테스트용 엔드포인트"""
    test_url = "https://jsonplaceholder.typicode.com/posts/1"
    return proxy_get_request(test_url)

# 서버 실행 부분을 수정
if __name__ == "__main__":
    import uvicorn
    print("🚀 Fixed API Proxy Server 시작...")
    print("📍 엔드포인트:")
    print("   - GET  /")
    print("   - GET  /health") 
    print("   - GET  /proxy?url=<target_url>")
    print("   - GET  /test")
    print("\n🌍 서버 URL: http://localhost:8000")
    
    try:
        uvicorn.run("__main__:app", host="0.0.0.0", port=8000, reload=False)
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        print("💡 다른 포트로 시도해보세요: uvicorn fixed_proxy_server:app --port 8001")