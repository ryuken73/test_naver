"""
네이버 뉴스 검색 API + 분석 지표 FastAPI 서버.
"""
from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any, Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analyzer import analyze_items, clean_text, press_from_link, summarize_article
from journalist_insights import title_jaccard_between_corpora

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent
# 루트 또는 backend 폴더의 .env 모두 지원 (backend 쪽이 우선)
load_dotenv(_PROJECT_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)

NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json"
NAVER_CLIENT_ID = (os.getenv("NAVER_CLIENT_ID") or "").strip()
NAVER_CLIENT_SECRET = (os.getenv("NAVER_CLIENT_SECRET") or "").strip()


class SearchBody(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    sort: Literal["sim", "date"] = "sim"
    display: int = Field(30, ge=1, le=100)


app = FastAPI(title="Naver News Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


async def fetch_naver_news(query: str, sort: str, display: int) -> dict[str, Any]:
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail=(
                "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 비어 있습니다. "
                f"다음 파일 중 하나에 값을 넣어 주세요: "
                f"{_BACKEND_DIR / '.env'} 또는 {_PROJECT_ROOT / '.env'} "
                f"(예시: backend/.env.example 복사 후 수정)"
            ),
        )
    params = {"query": query, "display": display, "sort": sort, "start": 1}
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(NAVER_NEWS_URL, params=params, headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text[:500])
    return r.json()


@app.post("/api/search")
async def search(body: SearchBody) -> dict[str, Any]:
    other_sort: Literal["sim", "date"] = "date" if body.sort == "sim" else "sim"
    raw, raw_other = await asyncio.gather(
        fetch_naver_news(body.query, body.sort, body.display),
        fetch_naver_news(body.query, other_sort, body.display),
    )
    items_raw = raw.get("items") or []
    items: list[dict[str, Any]] = []
    for it in items_raw:
        ol, lk = it.get("originallink", ""), it.get("link", "")
        t = clean_text(it.get("title", ""))
        d = clean_text(it.get("description", ""))
        summ = summarize_article(t, d)
        items.append(
            {
                "title": t,
                "description": d,
                "press": press_from_link(ol, lk),
                "originallink": ol,
                "link": lk,
                "pubDate": it.get("pubDate", ""),
                "summary": summ,
            }
        )
    metrics = analyze_items(items_raw, body.query)
    titles_a = [clean_text(x.get("title", "")) for x in items_raw]
    titles_b = [clean_text(x.get("title", "")) for x in (raw_other.get("items") or [])]
    metrics["journalist"]["competition"].update(
        {
            "primary_sort": body.sort,
            "comparison_sort": other_sort,
            "title_overlap": title_jaccard_between_corpora(titles_a, titles_b),
            "note": (
                f"동일 검색어·건수로 정렬만 달리한 상위 {body.display}건 제목 집합의 Jaccard 겹침입니다. "
                "값이 낮으면 ‘관련도 상위’와 ‘최신 상위’가 서로 다른 기사 묶음일 수 있습니다."
            ),
        }
    )
    return {
        "total": raw.get("total", 0),
        "start": raw.get("start", 1),
        "display": len(items),
        "items": items,
        "metrics": metrics,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
