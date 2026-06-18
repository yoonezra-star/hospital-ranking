# 병원찾기 - 전국 병의원 순위 정보

건강보험심사평가원 공공데이터 기반 전국 병의원 랭킹, 후기, 진료 시간 정보를 제공하는 정적 웹사이트입니다.

## 기술 스택

- **HTML5** + **CSS3** + **Vanilla JavaScript**
- **배포**: Cloudflare Pages + GitHub 연동

## 로컬 실행

```bash
# 방법 1: VS Code Live Server 확장
# index.html을 우클릭 → "Open with Live Server"

# 방법 2: Python
python -m http.server 8080

# 방법 3: Node.js
npx serve .
```

브라우저에서 `http://localhost:8080` 접속

## Cloudflare Pages 배포

1. **GitHub 리포지토리 생성** 및 코드 Push
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 병원찾기 사이트"
   git remote add origin https://github.com/[사용자명]/hospital-ranking.git
   git push -u origin main
   ```

2. **Cloudflare Pages 연결**
   - [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → "Create a project"
   - "Connect to Git" → GitHub 리포 선택
   - 빌드 설정:
     - **Framework preset**: None
     - **Build command**: (비워두기)
     - **Build output directory**: `/` (루트)
   - "Save and Deploy" 클릭

3. 자동으로 `*.pages.dev` 도메인이 할당됩니다.

## 공공데이터 API 연동 가이드

현재는 `js/data.js`에 Mock 데이터를 사용합니다. 실제 API로 전환하려면:

### 1단계: API 키 발급
1. [공공데이터포털](https://data.go.kr) 회원가입
2. "건강보험심사평가원 병원정보서비스" 검색 → 활용신청
3. 마이페이지에서 **인증키(Encoding)** 복사

### 2단계: Cloudflare Workers 프록시 생성
CORS 문제 해결을 위해 Cloudflare Workers에 프록시를 설정합니다.

```javascript
// functions/api/hospitals.js (Cloudflare Pages Functions)
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const params = url.searchParams;

  const apiUrl = new URL('http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList');
  apiUrl.searchParams.set('serviceKey', context.env.DATA_GO_KR_API_KEY);
  apiUrl.searchParams.set('_type', 'json');
  apiUrl.searchParams.set('numOfRows', params.get('limit') || '20');
  apiUrl.searchParams.set('pageNo', params.get('page') || '1');

  if (params.get('region'))     apiUrl.searchParams.set('sidoCd', params.get('region'));
  if (params.get('district'))   apiUrl.searchParams.set('sgguCd', params.get('district'));
  if (params.get('name'))       apiUrl.searchParams.set('yadmNm', params.get('name'));
  if (params.get('department')) apiUrl.searchParams.set('dgsbjtCd', params.get('department'));

  const response = await fetch(apiUrl.toString());
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
```

### 3단계: 프론트엔드 데이터 교체
`js/data.js`의 `HOSPITALS` 배열을 API 호출로 교체:

```javascript
async function fetchHospitals(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`/api/hospitals?${params}`);
  const data = await res.json();
  return data.response.body.items.item.map(item => ({
    name: item.yadmNm,
    address: item.addr,
    type: item.clCdNm,
    department: item.dgsbjtCdNm,
    phone: item.telno,
    lat: parseFloat(item.YPos),
    lng: parseFloat(item.XPos),
    openDate: item.estbDd,
    // score, reviewCount 등은 별도 데이터 필요
  }));
}
```

### API 필드 매핑표

| API 응답 필드 | 설명 | 매핑 |
|-------------|------|------|
| `yadmNm` | 병원명 | `name` |
| `addr` | 주소 | `address` |
| `clCdNm` | 종별코드명 | `type` |
| `dgsbjtCdNm` | 진료과목코드명 | `department` |
| `telno` | 전화번호 | `phone` |
| `XPos` | 경도 | `lng` |
| `YPos` | 위도 | `lat` |
| `estbDd` | 개설일자 | `openDate` |
| `sidoCdNm` | 시도명 | `region` |
| `sgguCdNm` | 시군구명 | `district` |
| `drTotCnt` | 의사 총수 | `specialistCount` |

## 프로젝트 구조

```
hospital/
├── index.html          # 메인 페이지
├── css/
│   └── style.css       # 디자인 시스템
├── js/
│   ├── data.js         # Mock 데이터 (→ API 교체 예정)
│   ├── app.js          # 메인 앱 로직
│   └── search.js       # 검색/필터 로직
└── README.md           # 이 파일
```

## 라이선스

MIT License
