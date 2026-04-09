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

프로젝트 **루트**에서 가상환경을 만든 뒤, 패키지 `backend`를 uvicorn으로 띄웁니다.

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

(`requirements.txt`는 루트에 있으며 `backend/requirements.txt`를 끌어옵니다.)

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

**프론트(Vite 정적) + FastAPI**를 한 프로젝트에서 배포합니다. 루트의 `vercel.json`·`pyproject.toml`이 빌드·Python 런타임을 정의합니다 ([FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi)).

### 프로젝트 설정 (대시보드)

| 항목 | 권장 값 |
|------|---------|
| **Root Directory** | **`.`** (저장소 루트, 비우거나 `./`) |
| Framework Preset | **Vite** 또는 **Other** (자동 감지되면 그대로) |
| Build / Output / Install | 저장소 루트 `vercel.json`이 우선 (`frontend` 빌드 + `pip install`) |
| Node.js Version | **20.x** (`frontend/.nvmrc`와 맞춤) |

**Root Directory를 `frontend`만 두면** Python 백엔드가 배포에 포함되지 않습니다. 반드시 **루트**를 프로젝트 루트로 두세요.

### 환경 변수 (Vercel → Settings → Environment Variables)

| Name | 설명 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 검색 API Client ID (**백엔드**에서 사용, Production 등 필요한 환경에 등록) |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API Client Secret |
| `VITE_API_URL` | (선택) 비우면 **같은 배포 도메인**으로 `/api` 호출. API를 **별도 서버**에만 둘 때만 백엔드 origin을 넣고 재빌드 |

로컬에서는 `VITE_API_URL`을 비우고 Vite 프록시(`/api` → `localhost:8000`)를 씁니다.

**이전에 `POST …/api/search 405`** 가 났던 경우는, Root가 `frontend`만 잡혀 정적 사이트에 API 요청이 간 경우입니다. 루트 배포 + 위 환경 변수로 해결됩니다.

### 백엔드(CORS)

`backend/main.py`에 `*.vercel.app` 출처가 허용되어 있습니다. 별도 도메인만 쓸 때는 해당 origin을 추가하세요.

### 빌드 안정화 (참고)

Tailwind CSS v4는 **`@tailwindcss/postcss`** + `postcss.config.js`로 처리합니다(`@tailwindcss/vite` 플러그인 미사용). Vercel/Git 연동 빌드에서 발생하던 일부 환경 오류를 줄이기 위한 구성입니다.

**`Cannot read properties of undefined (reading 'fsPath')`가 Vercel 빌드 로그에만 뜰 때**

1. Vercel 프로젝트 **Settings → Environment Variables**에서 **`VERCEL_CLI_VERSION`** 이 있으면 **삭제**하세요. (구버전 CLI가 최신 빌드 파이프라인과 맞지 않아 동일 메시지가 나는 사례가 있습니다.)
2. **Root Directory**가 **저장소 루트(`.`)** 인지 확인하세요. FastAPI를 같이 쓰려면 `frontend`만 지정하면 안 됩니다.
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
├── vercel.json              # Vercel: 프론트 빌드 + SPA rewrite (/api 제외)
├── pyproject.toml           # Vercel: FastAPI 앱 엔트리 (backend.main:app)
├── requirements.txt         # pip: -r backend/requirements.txt
├── backend/
│   ├── main.py              # FastAPI, 네이버 연동
│   ├── analyzer.py
│   ├── journalist_insights.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       └── ...
├── restart.ps1
└── restart.sh
```

## 보안

- **API 키·시크릿은 `backend/.env`에만 두고**, 저장소에는 **`backend/.env.example`처럼 변수 이름만** 둡니다.
- 키가 유출된 적이 있다면 네이버 개발자센터에서 **재발급·폐기**하세요.

## 라이선스

이 저장소는 예시·학습 목적에 맞게 자유롭게 수정해 사용할 수 있습니다. 네이버 API 이용은 [네이버 개발자 센터 약관](https://developers.naver.com/docs/common/openapiguide/)을 따릅니다.
