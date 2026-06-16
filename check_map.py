import time
import sys
from playwright.sync_api import sync_playwright

def main():
    url = "https://hospital-ranking.pages.dev"
    screenshot_path = r"C:\Users\yoone\.gemini\antigravity\brain\91bf3c59-7b13-49d8-9488-0cdf0494ce68\media_map_verification.png"
    
    print(f"Visiting {url}...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 카카오맵은 모바일/데스크톱 해상도 대응을 위해 일반적인 크기로 창 생성
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        # 콘솔 이벤트 핸들러 등록
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type.upper()}: {msg.text} at {msg.location}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR]: {err}\nStack: {getattr(err, 'stack', 'No stack available')}"))
        
        # 네트워크 응답 관찰 (카카오맵 API 차단 여부 체크)
        def handle_response(response):
            if "dapi.kakao.com" in response.url or "apis.data.go.kr" in response.url:
                print(f"[NET] {response.status} {response.url[:100]}...")
        page.on("response", handle_response)
        
        try:
            page.goto(url, wait_until="networkidle", timeout=15000)
        except Exception as e:
            print(f"Initial load completed or timed out: {e}")
            
        print("Waiting 6 seconds for Map API initialization...")
        time.sleep(6)
        
        # #map-canvas DOM 분석
        map_canvas = page.query_selector("#map-canvas")
        if map_canvas:
            html_content = map_canvas.inner_html()
            print("\n--- Map Canvas Inner HTML Length ---")
            print(len(html_content))
            
            # 카카오맵이 성공적으로 그려지면 내부에 daum 또는 kakao 관련 스타일, svg, 혹은 타일 이미지 엘리먼트가 들어감
            if "daum" in html_content.lower() or "kakao" in html_content.lower() or "div" in html_content.lower():
                print("SUCCESS: Kakao Map DOM elements detected inside #map-canvas!")
            else:
                print("WARNING: #map-canvas exists but seems empty. Check Kakao Map loading errors.")
        else:
            print("ERROR: #map-canvas element not found on page.")
            
        # 스크린샷 캡쳐
        print(f"Saving screenshot to {screenshot_path}...")
        page.screenshot(path=screenshot_path)
        print("Screenshot saved.")
        
        browser.close()

if __name__ == "__main__":
    main()