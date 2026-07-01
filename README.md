# 병원찾기

`hospital-ranking.kr` 정적 사이트 소스입니다. 공공 데이터와 공개 가능한 병원 정보를 바탕으로 지역별 병원 검색, 병원 상세 정보, 진료과별 가이드, 운영조건별 랜딩 페이지를 제공합니다.

## 운영 기준

- 사이트명: 병원찾기
- 운영 도메인: `https://hospital-ranking.kr`
- 배포 방식: GitHub `main` 브랜치 푸시 후 Cloudflare Pages 자동 배포
- 광고 정책: 애드센스 승인용 스크립트만 삽입하고, 승인 전 빈 광고 영역은 노출하지 않습니다.
- 의료 정보 기준: 모든 건강 정보는 참고용이며 진단, 처방, 수술 여부 판단은 의료진 상담이 우선입니다.

## 주요 구성

- `index.html`: 메인 검색 페이지
- `detail.html`: 병원 상세 페이지
- `guide.html`, `guide-*.html`: 건강가이드와 진료 준비 체크리스트
- `*-clinic.html`, `seoul-*.html` 등: 지역/조건별 랜딩 페이지
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `ad-policy.html`, `editorial-policy.html`: 신뢰/정책 페이지
- `functions/api/*.js`: Cloudflare Pages Functions API 프록시
- `scripts/generate-sitemap.js`: 사이트맵 생성
- `scripts/regenerate-guides.js`: 건강가이드 페이지 재생성

## 로컬 실행

정적 사이트라 별도 빌드 없이 실행할 수 있습니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

## 배포 흐름

```powershell
git status
git add .
git commit -m "작업 내용"
git push origin main
```

Cloudflare Pages가 GitHub `main` 브랜치 변경을 감지해 자동 배포합니다.

## 검증 명령

```powershell
$node='C:\Users\yoone\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --check js\app.js
& $node --check js\detail.js
& $node --check js\search.js
& $node --check js\hospital-content.js
& $node --check scripts\generate-sitemap.js
& $node --check scripts\regenerate-guides.js
```

사이트맵 재생성:

```powershell
$node='C:\Users\yoone\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node scripts\generate-sitemap.js
```

## SEO 및 승인 체크

- `robots.txt`는 `https://hospital-ranking.kr/sitemap.xml`을 가리켜야 합니다.
- `sitemap.xml`은 `.html` 확장자 없는 clean URL을 사용합니다.
- `404.html`은 `noindex,nofollow`로 운영합니다.
- 모든 공개 페이지는 고유한 `title`, `description`, canonical URL을 가져야 합니다.
- 가이드와 상세 페이지에는 참고용 의료정보 고지와 정정 문의 경로가 있어야 합니다.

## 문의

운영 문의 및 정보 정정 요청: `replyleaders@naver.com`
