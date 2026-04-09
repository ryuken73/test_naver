# 네이버 뉴스 검색 · 분석 대시보드

네이버 [뉴스 검색 API](https://developers.naver.com/docs/serviceapi/search/news/news.md)로 기사를 가져와, 언론사·시계열·키워드·감성·팩트 밀도·연관어 네트워크 등을 시각화합니다. 추출형 요약과 방송 데스크용 **기자 인사이트**(타이밍, 정렬 비교, 논점 태그, 출처 집중도 등)를 함께 제공합니다.

## 기술 스택

| 구분 | 내용 |
|------|------|
| Backend | Python 3, FastAPI, httpx, kiwipiepy |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, react-force-graph-2d |

## 사전 요구

- Python 3.11+ 권장  
- Node.js 20+ / npm  
- [네이버 개발자센터](https://developers.naver.com/apps/#/my)에서 애플리케이션 등록 후 **Client ID**, **Client Secret** 발급 (검색 API 사용)

## 빠른 시작

### 1. 저장소 클론 후 환경 변수

```bash
cp backend/.env.example backend/.env
```

`backend/.env`를 열어 다음 값을 채웁니다. **이 파일은 Git에 올리지 마세요.**

```env
NAVER_CLIENT_ID=발급받은_클라이언트_ID
NAVER_CLIENT_SECRET=발급받은_시크릿
```

### 2. 백엔드

프로젝트 루트에서 가상환경을 만든 뒤, `backend` 폴더에서 서버를 띄웁니다.

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
cd backend
..\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

기본적으로 Vite는 `vite.config.ts`의 설정에 따라 **포트 80**에서 뜨도록 되어 있을 수 있습니다. Windows에서는 80번 포트에 **관리자 권한**이 필요할 수 있습니다. 개발 시 `vite.config.ts`의 `server.port`를 `5173` 등으로 바꿀 수 있습니다.

프록시: `/api` → `http://127.0.0.1:8000`

### 4. (Windows) 한 번에 재기동

PowerShell에서 프로젝트 루트:

```powershell
.\restart.ps1
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/search` | JSON: `query`, `sort`(`sim`\|`date`), `display`(1~100) |

검색 1회당 네이버 API는 **정렬 비교**를 위해 **2회** 호출됩니다(관련도순·최신순). 일일 호출 한도를 확인하세요.

## 프로젝트 구조 (요약)

```
test_naver/
├── backend/
│   ├── main.py              # FastAPI, 네이버 연동
│   ├── analyzer.py          # 지표·요약
│   ├── journalist_insights.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/      # SearchBox, NewsList, 대시보드 등
│       └── ...
├── restart.ps1
└── restart.sh
```

## 보안

- **API 키·시크릿은 `backend/.env`에만 두고**, 저장소에는 **`backend/.env.example`처럼 변수 이름만** 둡니다.
- 키가 유출된 적이 있다면 네이버 개발자센터에서 **재발급·폐기**하세요.

## 라이선스

이 저장소는 예시·학습 목적에 맞게 자유롭게 수정해 사용할 수 있습니다. 네이버 API 이용은 [네이버 개발자 센터 약관](https://developers.naver.com/docs/common/openapiguide/)을 따릅니다.
