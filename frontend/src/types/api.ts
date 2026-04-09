export type ArticleSummary = {
  headline: string
  bullets: string[]
  /** 읽기 쉬운 블록 텍스트(복사용) */
  formatted: string
}

export type NewsItem = {
  title: string
  description: string
  press: string
  originallink: string
  link: string
  pubDate: string
  summary: ArticleSummary
}

export type BasicMetrics = {
  press_share: { name: string; value: number; count: number }[]
  timeline: { date: string; count: number }[]
  top_keywords: { keyword: string; count: number }[]
}

export type AdvancedMetrics = {
  sentiment: {
    positive_count: number
    negative_count: number
    positive_ratio: number
    gauge_value: number
  }
  fact_radar: {
    numeric_density: number
    stat_terms: number
    large_numbers: number
    date_period: number
    overall_fact_score: number
  }
  cooccurrence: {
    nodes: { id: string; name: string; group: number; val: number }[]
    links: { source: string; target: string; value: number }[]
  }
}

export type TitleOverlap = {
  jaccard: number
  intersection: number
  union_size: number
  only_a: number
  only_b: number
}

export type JournalistMetrics = {
  competition: {
    primary_sort: string
    comparison_sort: string
    title_overlap: TitleOverlap
    note: string
  }
  timing: {
    earliest: null | {
      press: string
      pub_date: string
      title: string
      link: string
      note: string
    }
    hourly: { bucket: string; count: number }[]
    bursts: { bucket: string; count: number; note: string }[]
    keyword_shift: {
      early_top: { keyword: string; count: number }[]
      late_top: { keyword: string; count: number }[]
      emerging?: { keyword: string; count: number }[]
      fading?: { keyword: string; count: number }[]
      note: string
    }
  }
  framing: {
    topic_tags: { tag: string; count: number }[]
    balance_note: string
  }
  regional_and_entities: {
    proper_nouns_top: { name: string; count: number }[]
    note: string
  }
  event_types: { tag: string; count: number }[]
  evidence: {
    articles_with_number_and_org_cue_ratio: number
    avg_numbers_per_article: number
    note: string
  }
  followup: {
    hub_keyword: string
    peripheral_keywords: {
      word: string
      score: number
      cooccur_with_hub: number
      article_mentions: number
      hint: string
    }[]
  }
  risk: {
    press_hhi: number
    top_press_name: string
    top_press_share_pct: number
    diversity_warning: boolean
    similar_title_clusters: {
      representative_title: string
      count: number
      samples: string[]
    }[]
    note: string
  }
}

export type SearchResponse = {
  total: number
  start: number
  display: number
  items: NewsItem[]
  metrics: {
    basic: BasicMetrics
    advanced: AdvancedMetrics
    journalist: JournalistMetrics
  }
}
