"""
뉴스 검색 결과 기반 지표 계산 (최대 100건 샘플).
"""
from __future__ import annotations

import html
import re
from collections import Counter
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

from journalist_insights import build_journalist_insights

# --- Kiwi (형태소) ---
try:
    from kiwipiepy import Kiwi

    _kiwi = Kiwi()
except Exception:  # pragma: no cover
    _kiwi = None

# --- 간단 한국어 감성 사전 (MVP) ---
_POS = frozenset(
    """
    좋다 훌륭하다 성공 상승 호재 개선 최고 최선 긍정 희망 기대 안정 회복
    증가 확대 유리 긍정적 우수 선전 활성 낙관 향상 발전 혁신 훌륭 멋지다
    강세 호황 호조 순조 양호 만족 환영 지지 신뢰 투명 공정 합리
    """.split()
)
_NEG = frozenset(
    """
    나쁘다 실패 하락 악재 악화 최악 부정 우려 위기 불안 하락 감소 축소
    악영향 약세 침체 불황 악재 손실 적자 폐업 파산 사고 사망 부상
    비판 논란 의혹 부정적 불만 저조 악화 우려 불투명 부패 부정
    """.split()
)

_STOPWORDS = frozenset(
    """
    기자 뉴스 연합뉴스 이데일리 조선일보 중앙일보 한겨레 경향 매일
    등 이가 그것 것 수 때 년 월 일 오전 오후 시 분 초
    """.split()
)

_RE_TAGS = re.compile(r"<[^>]+>")
_RE_NUM = re.compile(r"\d[\d,.\s]*\d|\d+")
_RE_PCT = re.compile(r"%|퍼센트|프로|비율")
_RE_LARGE = re.compile(r"[조억만]\s*원|[조억]\s*명")
_RE_DATE = re.compile(r"\d{4}\s*년|\d{1,2}\s*월|\d{1,2}\s*일|분기|상반기|하반기")


def clean_text(raw: str) -> str:
    if not raw:
        return ""
    t = html.unescape(raw)
    t = _RE_TAGS.sub(" ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def press_from_link(originallink: str, link: str) -> str:
    url = originallink or link or ""
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        if not host:
            return "기타"
        parts = host.split(".")
        if len(parts) >= 2:
            return parts[-2].replace("-", " ").title()
        return host
    except Exception:
        return "기타"


def parse_pub_date(pub_date: str) -> datetime | None:
    if not pub_date:
        return None
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S +0900",
    ):
        try:
            return datetime.strptime(pub_date.strip(), fmt)
        except ValueError:
            continue
    return None


def _anchors_in_article(full_text: str, nouns: list[str], main_set: set[str]) -> set[str]:
    """검색어 토큰이 명사로 잡히거나, 본문에 부분 문자열로 등장하면 앵커로 인정."""
    noun_set = set(nouns)
    found: set[str] = set()
    for m in main_set:
        if not m:
            continue
        if m in noun_set or m in full_text:
            found.add(m)
    return found


def tokenize_nouns(text: str) -> list[str]:
    if not text:
        return []
    if _kiwi is None:
        return [w for w in re.split(r"[^\w가-힣]+", text) if len(w) > 1 and w not in _STOPWORDS]
    out: list[str] = []
    for tok in _kiwi.tokenize(text):
        if tok.tag.startswith("N") and len(tok.form) > 1:
            if tok.form not in _STOPWORDS:
                out.append(tok.form)
    return out


def tokenize_nnp(text: str) -> list[str]:
    """고유명사(NNP) — 지명·기관 등 후보."""
    if not text or _kiwi is None:
        return []
    out: list[str] = []
    for tok in _kiwi.tokenize(text):
        if tok.tag.startswith("NNP") and len(tok.form) > 1:
            out.append(tok.form)
    return out


def split_sentences(text: str) -> list[str]:
    """본문을 문장 단위로 나눔 (요약용)."""
    if not text:
        return []
    t = text.strip()
    parts = re.split(r"(?<=[\.\!\?…])\s+|\s*\n\s*", t)
    merged: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if len(p) < 14 and merged:
            merged[-1] = f"{merged[-1]} {p}"
        else:
            merged.append(p)
    return merged if merged else [t]


def summarize_article(title: str, description: str) -> dict[str, Any]:
    """
    추출형 요약: 제목·본문 명사 겹침과 문장 위치로 점수화해 읽기 쉬운 포맷으로 반환.
    외부 API 없이 동작.
    """
    title = (title or "").strip()
    description = (description or "").strip()
    body = description if description else title
    title_nouns = set(tokenize_nouns(title))
    sents = split_sentences(body)

    def clip(s: str, n: int = 160) -> str:
        s = s.strip()
        if len(s) <= n:
            return s
        return s[: n - 1].rstrip() + "…"

    if not sents:
        h = clip(title, 140)
        return {
            "headline": h,
            "bullets": [],
            "formatted": _format_summary_text(h, []),
        }

    scored: list[tuple[float, int, str]] = []
    for i, sent in enumerate(sents):
        s = sent.strip()
        if len(s) < 18:
            continue
        sn = set(tokenize_nouns(s))
        overlap = len(title_nouns & sn)
        len_ok = min(len(s), 220) / 70.0
        pos = 1.35 if i == 0 else (1.1 if i == 1 else 0.95)
        score = overlap * 3.0 + len_ok * pos
        scored.append((score, i, s))

    scored.sort(key=lambda x: (-x[0], x[1]))
    picked: list[str] = []
    seen_prefix: set[str] = set()
    for _, _, sent in scored:
        key = sent[:50]
        if key in seen_prefix:
            continue
        seen_prefix.add(key)
        picked.append(sent)
        if len(picked) >= 4:
            break

    if not picked:
        picked = [clip(sents[0], 220)]

    headline = clip(picked[0], 160)
    bullets = [clip(p, 140) for p in picked[1:3]]
    bullets = [b for b in bullets if b and b != headline]

    return {
        "headline": headline,
        "bullets": bullets,
        "formatted": _format_summary_text(headline, bullets),
    }


def _format_summary_text(headline: str, bullets: list[str]) -> str:
    lines = [
        "────────  요약  ────────",
        "",
        f"▶ {headline}",
    ]
    if bullets:
        lines.append("")
        lines.append("  · 추가로 알아두면 좋은 내용")
        for b in bullets:
            lines.append(f"    · {b}")
    lines.append("")
    lines.append("────────────────────────")
    return "\n".join(lines)


def analyze_items(
    items: list[dict[str, Any]],
    query: str,
    max_keyword: int = 15,
    max_cooccur: int = 25,
) -> dict[str, Any]:
    """items: 네이버 API item dict 리스트 (title, description, originallink, link, pubDate)."""
    cleaned_titles: list[str] = []
    cleaned_desc: list[str] = []
    full_texts: list[str] = []
    presses: list[str] = []
    times: list[datetime | None] = []
    enriched: list[dict[str, Any]] = []

    for it in items:
        title = clean_text(it.get("title", ""))
        desc = clean_text(it.get("description", ""))
        ol, lk = it.get("originallink", ""), it.get("link", "")
        cleaned_titles.append(title)
        cleaned_desc.append(desc)
        full_texts.append(f"{title} {desc}")
        presses.append(press_from_link(ol, lk))
        tdt = parse_pub_date(it.get("pubDate", ""))
        times.append(tdt)
        enriched.append(
            {
                "title": title,
                "full_text": f"{title} {desc}",
                "press": press_from_link(ol, lk),
                "link": ol or lk,
                "dt": tdt,
            }
        )

    # --- 일반: 언론사 점유 ---
    press_counts = Counter(presses)
    total_p = sum(press_counts.values()) or 1
    press_share = [
        {"name": k, "value": round(v / total_p * 100, 2), "count": v}
        for k, v in press_counts.most_common(20)
    ]

    # --- 일반: 시계열 (일자별) ---
    day_counts: Counter[str] = Counter()
    for t in times:
        if t:
            day_counts[t.strftime("%Y-%m-%d")] += 1
    timeline = sorted(
        [{"date": d, "count": c} for d, c in day_counts.items()],
        key=lambda x: x["date"],
    )

    # --- 일반: 키워드 ---
    all_nouns: list[str] = []
    for ft in full_texts:
        all_nouns.extend(tokenize_nouns(ft))
    kw_counts = Counter(all_nouns)
    top_keywords = [
        {"keyword": k, "count": v}
        for k, v in kw_counts.most_common(max_keyword)
    ]

    # --- 심화: 감성 (제목+요약, 명사/형용사/동사 형태 기준) ---
    pos_hits = neg_hits = 0
    for ft in full_texts:
        words: list[str] = []
        if _kiwi:
            for tok in _kiwi.tokenize(ft):
                if tok.tag.startswith(("N", "V", "M", "XR")) or tok.tag.startswith("VA"):
                    words.append(tok.form)
        else:
            words = tokenize_nouns(ft)
        for w in words:
            if w in _POS:
                pos_hits += 1
            if w in _NEG:
                neg_hits += 1
    denom = pos_hits + neg_hits
    if denom == 0:
        sentiment_ratio = 50.0
    else:
        sentiment_ratio = round(pos_hits / denom * 100, 2)
    sentiment = {
        "positive_count": pos_hits,
        "negative_count": neg_hits,
        "positive_ratio": sentiment_ratio,
        "gauge_value": sentiment_ratio,
    }

    # --- 심화: 팩트 밀도 (레이더 4축, 0~100) ---
    n_art = len(full_texts) or 1
    num_scores: list[float] = []
    pct_scores: list[float] = []
    large_scores: list[float] = []
    date_scores: list[float] = []

    for ft in full_texts:
        ln = max(len(ft), 1)
        num_scores.append(len(_RE_NUM.findall(ft)) / ln * 500)
        pct_scores.append(len(_RE_PCT.findall(ft)) / ln * 800)
        large_scores.append(len(_RE_LARGE.findall(ft)) / ln * 400)
        date_scores.append(len(_RE_DATE.findall(ft)) / ln * 600)

    def avg_clip(vals: list[float]) -> float:
        if not vals:
            return 0.0
        return float(min(100.0, sum(vals) / len(vals)))

    fact_radar = {
        "numeric_density": round(avg_clip(num_scores), 2),
        "stat_terms": round(avg_clip(pct_scores), 2),
        "large_numbers": round(avg_clip(large_scores), 2),
        "date_period": round(avg_clip(date_scores), 2),
        "overall_fact_score": round(
            (
                avg_clip(num_scores)
                + avg_clip(pct_scores)
                + avg_clip(large_scores)
                + avg_clip(date_scores)
            )
            / 4,
            2,
        ),
    }

    # --- 심화: 연관어 (검색어 토큰과 동일 기사 내 동시출현) ---
    query_tokens = tokenize_nouns(query) or []
    if not query_tokens:
        q = query.strip()
        if q:
            query_tokens = [q]
    main_set = {q for q in query_tokens if len(q) > 0}
    if not main_set and query.strip():
        main_set = {query.strip()}
    # 공백으로 나뉜 어절도 앵커 후보 (예: 복합어가 따로 잡히는 경우)
    for part in re.split(r"\s+", query.strip()):
        if len(part) >= 2 and part not in main_set:
            main_set.add(part)

    pair_counts: Counter[tuple[str, str]] = Counter()
    node_counts: Counter[str] = Counter()

    for ft in full_texts:
        nouns = tokenize_nouns(ft)
        seen_main = _anchors_in_article(ft, nouns, main_set)
        if not seen_main:
            continue
        for m in seen_main:
            node_counts[m] = node_counts.get(m, 0) + 1
            for n in nouns:
                if n in main_set or n == m:
                    continue
                pair_counts[(m, n)] += 1
                node_counts[n] = node_counts.get(n, 0) + 1

    # 앵커가 한 번도 잡히지 않았을 때: 상위 키워드 간 동시출현으로 그래프 생성
    if not pair_counts and full_texts and kw_counts:
        top_terms = [w for w, _ in kw_counts.most_common(12)]
        for ft in full_texts:
            nouns_list = tokenize_nouns(ft)
            nouns_set = set(nouns_list)
            present = [t for t in top_terms if t in nouns_set]
            if len(present) < 2:
                continue
            for i, a in enumerate(present):
                for b in present[i + 1 :]:
                    if a == b:
                        continue
                    pair_counts[(a, b)] += 1
                    node_counts[a] = node_counts.get(a, 0) + 1
                    node_counts[b] = node_counts.get(b, 0) + 1

    # 여전히 비었으면: 최빈 키워드를 허브로 같은 기사 내 다른 명사와 연결
    if not pair_counts and full_texts and kw_counts:
        hub, _ = kw_counts.most_common(1)[0]
        for ft in full_texts:
            nouns_list = tokenize_nouns(ft)
            if hub not in nouns_list:
                continue
            for n in nouns_list:
                if n == hub:
                    continue
                pair_counts[(hub, n)] += 1
                node_counts[hub] = node_counts.get(hub, 0) + 1
                node_counts[n] = node_counts.get(n, 0) + 1

    nodes: list[dict[str, Any]] = []
    for tok in main_set:
        nodes.append({"id": tok, "name": tok, "group": 0, "val": node_counts.get(tok, 1)})
    for word, cnt in node_counts.most_common(max_cooccur):
        if word in main_set:
            continue
        nodes.append({"id": word, "name": word, "group": 1, "val": cnt})

    links: list[dict[str, Any]] = []
    for (a, b), w in pair_counts.most_common(80):
        links.append({"source": a, "target": b, "value": w})

    cooccurrence = {"nodes": nodes[: max_cooccur + len(main_set)], "links": links}

    journalist = build_journalist_insights(
        enriched=enriched,
        _query=query,
        kw_counts=kw_counts,
        pair_counts=pair_counts,
        press_counts=press_counts,
        tokenize_nouns=tokenize_nouns,
        tokenize_nnp=tokenize_nnp,
        kiwi_available=_kiwi is not None,
    )

    return {
        "basic": {
            "press_share": press_share,
            "timeline": timeline,
            "top_keywords": top_keywords,
        },
        "advanced": {
            "sentiment": sentiment,
            "fact_radar": fact_radar,
            "cooccurrence": cooccurrence,
        },
        "journalist": journalist,
    }
