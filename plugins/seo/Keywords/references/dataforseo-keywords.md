# DataForSEO Keywords API Reference

Detailed endpoint parameters for keyword research operations. Load this reference when needing specific filter syntax, field names, or advanced options.

## Table of Contents

1. [Authentication](#authentication)
2. [Keywords Data - Search Volume](#search-volume)
3. [Labs - Keyword Suggestions](#keyword-suggestions)
4. [Labs - Related Keywords](#related-keywords)
5. [Labs - Keyword Ideas](#keyword-ideas)
6. [Labs - Bulk Keyword Difficulty](#bulk-keyword-difficulty)
7. [Labs - Search Intent](#search-intent)
8. [Labs - Ranked Keywords](#ranked-keywords)
9. [Labs - SERP Competitors](#serp-competitors)
10. [Labs - Domain Intersection](#domain-intersection)
11. [Filtering Syntax](#filtering-syntax)
12. [Location Codes](#location-codes)

---

## Authentication

All requests use HTTP Basic Auth:
```
Authorization: Basic base64(login:password)
```

Base URL: `https://api.dataforseo.com/v3/`

All endpoints accept POST with JSON body. Body is always an array of task objects:
```json
[{ "keyword": "...", "location_code": 2840, "language_code": "en" }]
```

---

## Search Volume

**Endpoint:** `POST /keywords_data/google_ads/search_volume/live`
**Rate Limit:** 12 requests/minute
**Max Keywords:** 1000 per request

**Parameters:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| keywords | string[] | yes | - |
| location_code | int | no | - |
| language_code | string | no | - |
| search_partners | boolean | no | false |
| date_from | string (yyyy-mm-dd) | no | - |
| date_to | string (yyyy-mm-dd) | no | - |
| sort_by | string | no | - |

**Response fields per keyword:**
- `search_volume` - monthly average
- `competition` - HIGH / MEDIUM / LOW
- `competition_index` - 0-100
- `cpc` - cost per click (USD)
- `low_top_of_page_bid` / `high_top_of_page_bid`
- `monthly_searches[]` - {year, month, search_volume} (24 months)

---

## Keyword Suggestions

**Endpoint:** `POST /dataforseo_labs/google/keyword_suggestions/live`

**Parameters:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| keyword | string | yes | - |
| location_code | int | no | - |
| language_code | string | no | - |
| include_seed_keyword | boolean | no | false |
| include_serp_info | boolean | no | false |
| include_clickstream_data | boolean | no | false (2x cost) |
| exact_match | boolean | no | false |
| ignore_synonyms | boolean | no | false |
| filters | array | no | - |
| order_by | string[] | no | ["keyword_info.search_volume,desc"] |
| limit | int | no | 100 (max 1000) |
| offset | int | no | 0 |

**Response item fields:**
- `keyword` - the suggestion
- `keyword_info.search_volume`, `.cpc`, `.competition_level`, `.monthly_searches[]`
- `keyword_properties.keyword_difficulty` (0-100), `.core_keyword`, `.words_count`
- `search_intent_info.main_intent` (informational/commercial/transactional/navigational)

---

## Related Keywords

**Endpoint:** `POST /dataforseo_labs/google/related_keywords/live`

Same parameters as Keyword Suggestions. Returns semantically similar keywords grouped by `se_type`.

**Response item fields:**
- `keyword_data.keyword`
- `keyword_data.keyword_info.search_volume`, `.cpc`, `.competition_level`
- `related_keywords[]` - array of related keyword groups

---

## Keyword Ideas

**Endpoint:** `POST /dataforseo_labs/google/keyword_ideas/live`

Same parameters as Keyword Suggestions. Broader discovery than suggestions.

---

## Bulk Keyword Difficulty

**Endpoint:** `POST /dataforseo_labs/google/bulk_keyword_difficulty/live`
**Max Keywords:** 1000 per request

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| keywords | string[] | yes |
| location_code | int | no |
| language_code | string | no |

**Response item fields:**
- `keyword`
- `keyword_difficulty` (0-100)
- `search_volume`

---

## Search Intent

**Endpoint:** `POST /dataforseo_labs/google/search_intent/live`
**Max Keywords:** 1000 per request

**Response item fields:**
- `keyword`
- `keyword_intent.label` - informational / commercial / transactional / navigational
- `keyword_intent.probability` - 0.0 to 1.0
- `secondary_keyword_intents[]` - additional intents

---

## Ranked Keywords

**Endpoint:** `POST /dataforseo_labs/google/ranked_keywords/live`

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| target | string | yes (domain or URL) |
| location_code | int | no |
| language_code | string | no |
| item_types | string[] | no (e.g., ["organic"]) |
| limit | int | no (max 1000) |
| filters | array | no |
| order_by | string[] | no |

**Response structure:**
- `metrics.organic.count` - total organic keywords
- `metrics.organic.etv` - estimated traffic
- `metrics.organic.pos_1`, `.pos_2_3`, `.pos_4_10`, etc.
- `items[].keyword_data.keyword`
- `items[].ranked_serp_element.serp_item.rank_group`
- `items[].ranked_serp_element.serp_item.url`

---

## SERP Competitors

**Endpoint:** `POST /dataforseo_labs/google/serp_competitors/live`

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| keywords | string[] | yes |
| location_code | int | no |
| language_code | string | no |
| limit | int | no |

**Response item fields:**
- `domain`
- `avg_position`, `median_position`
- `rating` (0-1)
- `etv` - estimated traffic
- `keywords_count`
- `relevant_serp_items`

---

## Domain Intersection

**Endpoint:** `POST /dataforseo_labs/google/domain_intersection/live`

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| target1 | string | yes |
| target2 | string | yes |
| location_code | int | no |
| language_code | string | no |
| limit | int | no |

**Response item fields:**
- `keyword_data.keyword`
- `keyword_data.keyword_info.search_volume`
- `first_domain_serp_element.serp_item.rank_group`
- `second_domain_serp_element.serp_item.rank_group`

---

## Filtering Syntax

Filters use array notation: `[field, operator, value]`

**Operators:** `=`, `<>`, `>`, `<`, `>=`, `<=`, `contains`, `not_contains`, `in`, `not_in`, `like`, `not_like`

**Examples:**
```json
// Keywords with volume > 1000
["keyword_info.search_volume", ">", 1000]

// Multiple filters (AND)
[["keyword_info.search_volume", ">", 500], "and", ["keyword_properties.keyword_difficulty", "<", 50]]

// Competition level filter
["keyword_info.competition_level", "=", "LOW"]
```

**Order by examples:**
```json
["keyword_info.search_volume,desc"]
["keyword_properties.keyword_difficulty,asc"]
```

---

## Location Codes

| Code | Country | Code | Country |
|------|---------|------|---------|
| 2840 | United States | 2826 | United Kingdom |
| 2124 | Canada | 2036 | Australia |
| 2276 | Germany | 2250 | France |
| 2380 | Italy | 2724 | Spain |
| 2528 | Netherlands | 2076 | Brazil |
| 2356 | India | 2392 | Japan |
| 2410 | South Korea | 2484 | Mexico |

Full list: https://docs.dataforseo.com/v3/appendix/locations/
