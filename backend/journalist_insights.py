"""
방송·취재 데스크용 인사이트 (타이밍, 경쟁, 프레이밍, 지역, 후속, 리스크).
"""
from __future__ import annotations

import re
import statistics
from collections import Counter
from typing import Any

# --- 논점·이슈 태그 (키워드 매칭) ---
_TOPIC_PATTERNS: list[tuple[str, list[str]]] = [
    ("규제·입법", ["규제", "입법", "법안", "개정", "고시", "입법예고", "행정명령"]),
    ("정책·행정", ["정책", "정부", "행정", "지원", "예산", "부처", "장관", "청장"]),
    ("경제·시장", ["경제", "주가", "코스피", "코스닥", "금리", "환율", "수출", "수입", "성장률"]),
    ("사법·수사", ["재판", "검찰", "경찰", "수사", "구속", "기소", "판결", "법원"]),
    ("사고·재난", ["사고", "화재", "추락", "사망", "부상", "붕괴", "침수", "지진"]),
    ("외교·안보", ["외교", "정상회담", "군", "북한", "미국", "중국", "동맹", "안보"]),
    ("사회·논란", ["논란", "비판", "의혹", "제기", "항의", "집회", "시위"]),
    ("의료·복지", ["의료", "병원", "환자", "백신", "복지", "건강보험"]),
    ("교육", ["교육", "학교", "대학", "수능", "학생"]),
]

_EVENT_PATTERNS: list[tuple[str, list[str]]] = [
    ("사고", ["사고", "충돌", "전복", "화재", "붕괴"]),
    ("재판·수사", ["재판", "수사", "기소", "구속", "판결", "영장"]),
    ("정책·발표", ["발표", "브리핑", "대책", "로드맵", "계획"]),
    ("경제지표", ["실적", "분기", "매출", "적자", "흑자", "전망"]),
    ("인사", ["인사", "사장", "임명", "해임", "사퇴"]),
]

# 기관·인물 단서 (근거·인용 밀도)
_ORG_PERSON_CUES = re.compile(
    r"(?:장관|시장|도지사|대통령|청장|위원장|대표|기자회견|브리핑|"
    r"협회|위원회|청|부|처|시청|도청|본부|재단|연합회)"
)
_RE_NUM_ANY = re.compile(r"\d[\d,\.]*\s*(?:%|퍼센트|명|억|조|만)?|\d+\s*:\s*\d+")


def _match_tag_counts(texts: list[str], patterns: list[tuple[str, list[str]]]) -> list[dict[str, Any]]:
    combined = "\n".join(texts)
    out: list[dict[str, Any]] = []
    for label, keys in patterns:
        n = sum(combined.count(k) for k in keys)
        if n > 0:
            out.append({"tag": label, "count": n})
    out.sort(key=lambda x: -x["count"])
    return out


def _title_bigrams(title: str) -> set[str]:
    t = re.sub(r"\s+", "", title.strip())
    if len(t) < 2:
        return set()
    return {t[i : i + 2] for i in range(len(t) - 1)}


def _title_similarity(a: str, b: str) -> float:
    ga, gb = _title_bigrams(a), _title_bigrams(b)
    if not ga or not gb:
        return 0.0
    return len(ga & gb) / len(ga | gb)


def cluster_similar_titles(titles: list[str], threshold: float = 0.38) -> list[dict[str, Any]]:
    """유사 제목 그룹 (대표 제목 + 건수)."""
    if not titles:
        return []
    clusters: list[dict[str, Any]] = []
    for t in titles:
        if not t.strip():
            continue
        placed = False
        for c in clusters:
            if _title_similarity(t, c["rep"]) >= threshold:
                c["members"].append(t)
                placed = True
                break
        if not placed:
            clusters.append({"rep": t, "members": [t]})
    result: list[dict[str, Any]] = []
    for c in clusters:
        if len(c["members"]) < 2:
            continue
        rep = min(c["members"], key=len)
        result.append(
            {
                "representative_title": rep[:120] + ("…" if len(rep) > 120 else ""),
                "count": len(c["members"]),
                "samples": c["members"][:4],
            }
        )
    result.sort(key=lambda x: -x["count"])
    return result[:12]


def title_jaccard_between_corpora(titles_a: list[str], titles_b: list[str]) -> dict[str, Any]:
    """관련도순 vs 최신순 등 두 검색 결과의 제목 겹침."""
    sa = {t.strip() for t in titles_a if t.strip()}
    sb = {t.strip() for t in titles_b if t.strip()}
    if not sa and not sb:
        return {"jaccard": 0.0, "intersection": 0, "union_size": 0, "only_a": 0, "only_b": 0}
    inter = len(sa & sb)
    union = len(sa | sb)
    return {
        "jaccard": round(inter / union, 4) if union else 0.0,
        "intersection": inter,
        "union_size": union,
        "only_a": len(sa - sb),
        "only_b": len(sb - sa),
    }


def build_journalist_insights(
    enriched: list[dict[str, Any]],
    _query: str,
    kw_counts: Counter[str],
    pair_counts: Counter[tuple[str, str]],
    press_counts: Counter[str],
    tokenize_nouns: Any,
    tokenize_nnp: Any,
    kiwi_available: bool,
) -> dict[str, Any]:
    """
    enriched: {title, full_text, press, link, dt: datetime|None}
    """
    n = len(enriched)
    times_valid = [(i, e["dt"]) for i, e in enumerate(enriched) if e.get("dt")]

    # --- 타이밍: 최초 보도 추정 ---
    earliest: dict[str, Any] | None = None
    if times_valid:
        i_min, t_min = min(times_valid, key=lambda x: x[1])
        e = enriched[i_min]
        earliest = {
            "press": e.get("press", ""),
            "pub_date": t_min.isoformat(),
            "title": (e.get("title") or "")[:200],
            "link": e.get("link", ""),
            "note": "표본 내 가장 이른 게시 시각(네이버 스니펫 기준 추정)",
        }

    # 시간대별
    hourly: Counter[str] = Counter()
    for _i, dt in times_valid:
        hourly[dt.strftime("%Y-%m-%d %H:00")] += 1
    hourly_list = sorted(
        [{"bucket": k, "count": v} for k, v in hourly.items()],
        key=lambda x: x["bucket"],
    )

    counts_only = [x["count"] for x in hourly_list]
    bursts: list[dict[str, Any]] = []
    if counts_only:
        mean_c = statistics.mean(counts_only)
        try:
            stdev_c = statistics.stdev(counts_only) if len(counts_only) > 1 else 0.0
        except statistics.StatisticsError:
            stdev_c = 0.0
        thresh = mean_c + max(1.0, stdev_c * 0.8)
        for row in hourly_list:
            if row["count"] >= thresh and row["count"] >= 2:
                bursts.append(
                    {
                        "bucket": row["bucket"],
                        "count": row["count"],
                        "note": "동일 시간대 평균 대비 다건 집중",
                    }
                )
        bursts.sort(key=lambda x: -x["count"])
        bursts = bursts[:8]

    # 초반 vs 후반 키워드 (시간 중앙값 분할)
    keyword_shift: dict[str, Any] = {"early_top": [], "late_top": [], "note": ""}
    if len(times_valid) >= 6:
        sorted_idx = sorted(times_valid, key=lambda x: x[1])
        mid = len(sorted_idx) // 2
        early_idx = {x[0] for x in sorted_idx[:mid]}
        late_idx = {x[0] for x in sorted_idx[mid:]}
        early_nouns: list[str] = []
        late_nouns: list[str] = []
        for i, e in enumerate(enriched):
            ft = e.get("full_text", "")
            if i in early_idx:
                early_nouns.extend(tokenize_nouns(ft))
            if i in late_idx:
                late_nouns.extend(tokenize_nouns(ft))
        ce = Counter(early_nouns)
        cl = Counter(late_nouns)
        early_top = [k for k, _ in ce.most_common(12)]
        late_top = [k for k, _ in cl.most_common(12)]
        keyword_shift["early_top"] = [{"keyword": k, "count": ce[k]} for k in early_top[:8]]
        keyword_shift["late_top"] = [{"keyword": k, "count": cl[k]} for k in late_top[:8]]
        early_set, late_set = set(early_top), set(late_top)
        keyword_shift["emerging"] = [{"keyword": k, "count": cl[k]} for k in late_top if k not in early_set][:6]
        keyword_shift["fading"] = [{"keyword": k, "count": ce[k]} for k in early_top if k not in late_set][:6]
        keyword_shift["note"] = "표본을 시간 순으로 반으로 나눈 뒤 상위 키워드 차이를 봅니다."

    # 프레이밍: 논점 태그
    all_text = [e.get("full_text", "") for e in enriched]
    topic_tags = _match_tag_counts(all_text, _TOPIC_PATTERNS)
    event_types = _match_tag_counts(all_text, _EVENT_PATTERNS)

    # 지명·고유명사
    pn_counter: Counter[str] = Counter()
    if kiwi_available:
        for e in enriched:
            for w in tokenize_nnp(e.get("full_text", "")):
                if len(w) >= 2:
                    pn_counter[w] += 1
    proper_top = [{"name": w, "count": c} for w, c in pn_counter.most_common(20)]

    # 근거·수치 밀도
    rich = 0
    num_counts: list[int] = []
    for e in enriched:
        ft = e.get("full_text", "")
        nums = len(_RE_NUM_ANY.findall(ft))
        num_counts.append(nums)
        if nums >= 1 and _ORG_PERSON_CUES.search(ft):
            rich += 1
    evidence = {
        "articles_with_number_and_org_cue_ratio": round(rich / n, 4) if n else 0.0,
        "avg_numbers_per_article": round(statistics.mean(num_counts), 2) if num_counts else 0.0,
        "note": "숫자·비율 등과 기관·인사 단서가 함께 나오는 기사 비율(참고)",
    }

    # 후속 각도: 허브 대비 ‘연결은 많은데 단독 빈도는 낮은’ 단어
    followup: list[dict[str, Any]] = []
    if kw_counts:
        hub, hub_cnt = kw_counts.most_common(1)[0]
        doc_freq: Counter[str] = Counter()
        for e in enriched:
            seen = set(tokenize_nouns(e.get("full_text", "")))
            for w in seen:
                doc_freq[w] += 1
        candidates: list[tuple[str, float, int, int]] = []
        for (a, b), pcnt in pair_counts.items():
            if a != hub and b != hub:
                continue
            w = b if a == hub else a
            if w == hub or len(w) < 2:
                continue
            df = doc_freq.get(w, 1)
            # 링크 강도 / 문서 등장 (낮은 단독 빈도일수록 ‘주변 이슈’ 후보)
            score = pcnt / (df**0.5 + 0.5)
            candidates.append((w, score, pcnt, df))
        candidates.sort(key=lambda x: -x[1])
        for w, score, pcnt, df in candidates[:15]:
            followup.append(
                {
                    "word": w,
                    "score": round(score, 3),
                    "cooccur_with_hub": pcnt,
                    "article_mentions": df,
                    "hint": "허브 키워드와 자주 같이 나오나 단독 언급은 상대적으로 적을 수 있음",
                }
            )

    # 리스크: 출처 집중도 (HHI), 유사 제목
    total_press = sum(press_counts.values()) or 1
    shares = [c / total_press for c in press_counts.values()]
    hhi = sum(s * s for s in shares)
    top_press, top_c = press_counts.most_common(1)[0] if press_counts else ("", 0)
    top_pct = top_c / total_press * 100 if press_counts else 0.0
    diversity_warning = top_pct >= 42.0 or hhi >= 0.22

    titles = [e.get("title", "") for e in enriched if e.get("title")]
    similar_groups = cluster_similar_titles(titles)

    balance_note = ""
    if topic_tags:
        top_tag = topic_tags[0]["tag"]
        balance_note = f"논점 분포상 '{top_tag}' 관련 언급이 상대적으로 많습니다. 균형 보도 시 다른 논점을 점검해 보세요."

    return {
        "competition": {
            "primary_sort": "",
            "comparison_sort": "",
            "title_overlap": {
                "jaccard": 0.0,
                "intersection": 0,
                "union_size": 0,
                "only_a": 0,
                "only_b": 0,
            },
            "note": "FastAPI /api/search 에서 정렬 비교 지표로 덮어씁니다.",
        },
        "timing": {
            "earliest": earliest,
            "hourly": hourly_list,
            "bursts": bursts,
            "keyword_shift": keyword_shift,
        },
        "framing": {
            "topic_tags": topic_tags[:12],
            "balance_note": balance_note,
        },
        "regional_and_entities": {
            "proper_nouns_top": proper_top,
            "note": "Kiwi NNP(고유명사) 기준 빈도입니다.",
        },
        "event_types": event_types[:10],
        "evidence": evidence,
        "followup": {"hub_keyword": hub if kw_counts else "", "peripheral_keywords": followup[:12]},
        "risk": {
            "press_hhi": round(hhi, 4),
            "top_press_name": top_press,
            "top_press_share_pct": round(top_pct, 2),
            "diversity_warning": diversity_warning,
            "similar_title_clusters": similar_groups,
            "note": "HHI가 높을수록 소수 매체 비중이 큽니다. 유사 제목 다건은 동일 출처 재순환 가능성을 점검하세요.",
        },
    }
