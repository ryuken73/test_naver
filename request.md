# Role: Senior Full-stack Engineer & Data Analyst
# Task: Naver News Search & Deep Analysis Application

네이버 뉴스 API를 활용해 일반적인 기사 검색과 심화 분석 지표를 제공하는 웹 애플리케이션을 개발해줘.
최대한 빠르게 MVP(최소 기능 제품)를 구축하고, 이후 유지보수가 쉽도록 모듈화된 구조로 작성한다.

## 1. 기술 스택 (Tech Stack)
- Backend: Python (FastAPI) - 데이터 수집 및 분석 최적화
- Frontend: React (Vite), Tailwind CSS, Shadcn UI, Recharts (시각화)
- Data Analysis: KoNLPy 또는 단순 형태소 분석 로직, Scikit-learn

## 2. 핵심 기능 요구사항

### [기능 1: 일반 뉴스 검색]
- 사용자가 키워드를 입력하면 네이버 뉴스 API를 통해 최신순/관련도순 기사 리스트를 가져온다.
- 각 기사는 제목, 언론사, 게시 시간, 링크, 요약(description)을 포함한다.

### [기능 2: 지표 분석 (두 가지 카테고리)]
검색된 결과를 기반으로 다음 지표를 대시보드 형태로 시각화한다.

1. **일반 지표 (Basic Metrics):**
   - 언론사별 점유율 (Pie Chart)
   - 시간대별/일자별 기사 발행 추이 (Line Chart)
   - 가장 많이 언급된 상위 키워드 (Simple Bar Chart)

2. **심화 지표 (Advanced Metrics):**
   - **프레이밍 분석:** 긍정/부정 단어 분포를 통한 감성 분석 결과 (Gauge Chart)
   - **팩트 밀도 점수:** 기사 내 숫자, 통계 데이터 포함 비중을 계산한 품질 점수 (Radar Chart)
   - **연관어 네트워크:** 메인 키워드와 함께 등장한 연관어 관계 (Bubble 또는 Network 시각화)

## 3. 시스템 아키텍처 및 구현 가이드
- **Backend:** `main.py`에 API 엔드포인트를 만들고, `analyzer.py`에 뉴스 데이터 가공 로직을 분리해라.
- **Frontend:** `SearchBox`, `NewsList`, `GeneralDashboard`, `AdvancedDashboard`로 컴포넌트를 분리해라.
- **API Key 관리:** `.env` 파일을 사용하여 Naver Client ID와 Secret을 관리해라.
- **가속화:** 초기 분석 속도를 위해 비동기(httpx) 요청을 사용하고, 데이터 분석은 우선 수집된 100개의 샘플을 기준으로 수행해라.

## 4. 결과물 요구사항
1. Backend(FastAPI) 기본 구조와 네이버 뉴스 연동 코드.
2. 분석 알고리즘(언론사 분류, 키워드 추출, 감성 분석 로직) 초안.
3. React 기반의 깔끔하고 직관적인 대시보드 UI 코드.

지금 바로 프로젝트 구조 설계를 시작하고, 백엔드 코드부터 작성해줘.

> API 키는 `backend/.env`에만 두세요. `backend/.env.example`을 참고합니다.