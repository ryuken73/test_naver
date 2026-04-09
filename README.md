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

로컬 개발 서버는 기본 **포트 5173**입니다 (`vite.config.ts`의 `server.port`).

프록시: `/api` → `http://127.0.0.1:8000`

### 4. (Windows) 한 번에 재기동

PowerShell에서 프로젝트 루트:

```powershell
.\restart.ps1
```

## Vercel 배포 (Git 저장소 Import)

이 저장소는 **모노레포** 구조입니다(`frontend/`, `backend/`). Vercel 대시보드에서 **[Add New] → Project → GitHub/GitLab 저장소 Import**로 연동하는 경우 아래를 맞추면 됩니다.

### 프로젝트 설정

| 항목 | 권장 값 |
|------|---------|
| **Root Directory** | `frontend` |
| Framework Preset | Vite (자동 감지되면 그대로) |
| Build Command | `npm run build` (기본값) |
| Output Directory | `dist` (기본값) |
| Install Command | `npm install` (기본값) |

Root Directory를 `frontend`로 두면, 루트의 `frontend/vercel.json`(SPA용 rewrite)이 적용됩니다. 저장소 루트만 연결하고 Root를 비우면 `package.json`이 없어 빌드가 실패할 수 있습니다.

### 환경 변수 (Vercel → Settings → Environment Variables)

프론트는 **정적 호스팅**이라 Python 백엔드가 같은 프로젝트에 없습니다. API를 다른 곳(Railway, Render, 자체 서버 등)에 둔 경우 **백엔드 URL**만 프론트에 넘깁니다.

| Name | 설명 |
|------|------|
| `VITE_API_URL` | FastAPI 서버의 origin (예: `https://xxx.railway.app`). **끝에 `/` 없이** 등록. **Production·Preview 모두**에서 검색이 되게 하려면 각 환경에 넣거나 “All Environments”로 등록. |

로컬 개발에서는 `VITE_API_URL`을 비우고 Vite 프록시(`/api` → `localhost:8000`)를 씁니다.

**배포 후 검색 시 `POST …/api/search 405 (Method Not Allowed)`** 가 나오면, 브라우저가 **Vercel 정적 사이트**로 API 요청을 보내고 있다는 뜻입니다. `VITE_API_URL`을 백엔드 주소로 넣은 뒤 **반드시 재배포**(환경 변수는 빌드 시 번들에 들어감)하세요.

### 백엔드 배포

이 README는 프론트(Vercel) 위주입니다. FastAPI는 별도 호스팅에 두고, CORS에 `https://<your-vercel-app>.vercel.app` 등을 추가해야 합니다.

### 빌드 안정화 (참고)

Tailwind CSS v4는 **`@tailwindcss/postcss`** + `postcss.config.js`로 처리합니다(`@tailwindcss/vite` 플러그인 미사용). Vercel/Git 연동 빌드에서 발생하던 일부 환경 오류를 줄이기 위한 구성입니다.

**`Cannot read properties of undefined (reading 'fsPath')`가 Vercel 빌드 로그에만 뜰 때**

1. Vercel 프로젝트 **Settings → Environment Variables**에서 **`VERCEL_CLI_VERSION`** 이 있으면 **삭제**하세요. (구버전 CLI가 최신 빌드 파이프라인과 맞지 않아 동일 메시지가 나는 사례가 있습니다.)
2. **Root Directory**가 반드시 **`frontend`** 인지 확인하세요.
3. **Settings → General → Node.js Version**을 **20.x** (또는 `frontend/.nvmrc`와 동일)로 맞추세요.

프로젝트에서는 Tailwind/PostCSS 관련 패키지를 **`dependencies`**에 두어, 설치 단계에서 누락되지 않도록 했습니다.

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
