# E-E-A-T Scoring Rubric

Score pages on Experience, Expertise, Authoritativeness, and Trustworthiness. Each dimension scored 1-5. Use this rubric for page-level and site-level audits.

## Table of Contents

1. [Experience](#experience)
2. [Expertise](#expertise)
3. [Authoritativeness](#authoritativeness)
4. [Trustworthiness](#trustworthiness)
5. [YMYL Adjustments](#ymyl-adjustments)
6. [Scoring Summary](#scoring-summary)
7. [Fix Recommendations](#fix-recommendations)

---

## Experience

*Does the content demonstrate first-hand, real-world experience with the topic?*

| Score | Criteria | Signals |
|-------|----------|---------|
| 5 | Extensive first-hand experience clearly demonstrated | Original photos, specific case studies with data, "I tested X for Y months", unique insights only possible from experience |
| 4 | Clear evidence of personal experience | Personal anecdotes, specific examples, first-person perspective with concrete details |
| 3 | Some experience suggested but not explicit | General familiarity apparent, some practical tips, but could be researched |
| 2 | Minimal experience evident | Content reads as compiled from other sources, generic advice |
| 1 | No evidence of experience | Purely theoretical, clearly not written from experience |

**Key signals to look for:**
- First-person narrative ("When I implemented this...")
- Original images, screenshots, or data
- Specific details only someone with experience would know
- Nuanced opinions formed through actual use/practice

---

## Expertise

*Is the author/creator qualified and knowledgeable on this topic?*

| Score | Criteria | Signals |
|-------|----------|---------|
| 5 | Recognized expert with credentials | Author bio with relevant credentials, published works, cited by others, professional background in the field |
| 4 | Demonstrable expertise | Detailed technical accuracy, advanced coverage, author has relevant professional role |
| 3 | Competent coverage | Accurate and reasonably detailed, author has some relevant background |
| 2 | Surface-level knowledge | Correct but shallow, misses nuances, no evidence of author qualifications |
| 1 | Inaccurate or misleading | Factual errors, outdated information, no author attribution |

**Key signals to look for:**
- Author byline with bio and credentials
- Depth of coverage (beyond what a generalist could write)
- Technical accuracy and appropriate terminology
- Citations to relevant research/sources
- Author's other published work in the field

---

## Authoritativeness

*Is this site/author recognized as a go-to source on this topic?*

| Score | Criteria | Signals |
|-------|----------|---------|
| 5 | Industry authority | Referenced by other authoritative sites, strong backlink profile, featured in industry publications, recognized brand in the space |
| 4 | Established source | Good reputation, mentioned in industry contexts, solid backlink profile |
| 3 | Credible source | Some recognition, decent domain metrics, topically focused site |
| 2 | Limited authority | New or small site, few external mentions, limited topical focus |
| 1 | No authority | Unknown site, no external mentions, off-topic for its usual content |

**Key signals to look for:**
- Backlink profile (quality + quantity from relevant sites)
- Brand mentions across the web
- Topical focus of the site (niche authority vs. generalist)
- Domain age and history
- Social proof (followers, shares, community)

---

## Trustworthiness

*Is this content accurate, transparent, and safe for users?*

| Score | Criteria | Signals |
|-------|----------|---------|
| 5 | Highly trustworthy | Clear editorial policy, fact-checked content, transparent about limitations, HTTPS, privacy policy, contact info, no deceptive practices |
| 4 | Trustworthy | Accurate content, clear authorship, good site transparency |
| 3 | Mostly trustworthy | Generally accurate, some transparency gaps (missing about page, unclear authorship) |
| 2 | Questionable trust | Unsourced claims, unclear who's behind the site, aggressive monetization |
| 1 | Untrustworthy | Misleading content, deceptive design patterns, no transparency, security issues |

**Key signals to look for:**
- HTTPS with valid SSL
- Clear contact information and about page
- Privacy policy and terms of service
- Editorial/review process documented
- Transparent about sponsored/affiliate content
- Citations for factual claims
- No deceptive ads or dark patterns
- Content accuracy and currency

---

## YMYL Adjustments

For YMYL (Your Money Your Life) topics, apply stricter scoring:

| YMYL Category | Examples | Minimum Acceptable Score |
|---------------|----------|------------------------|
| Health/Medical | Symptoms, treatments, conditions | 4 per dimension |
| Financial | Investment, insurance, taxes | 4 per dimension |
| Legal | Rights, legal processes, regulations | 4 per dimension |
| Safety | Product safety, emergency info | 4 per dimension |
| News/Civic | Elections, policies, social issues | 3-4 per dimension |

For YMYL content scoring below minimums: flag as priority fix.

---

## Scoring Summary

### Per-Page Scorecard

```markdown
## E-E-A-T Score: [Page URL]

| Dimension | Score (1-5) | Key Finding |
|-----------|:-----------:|-------------|
| Experience | [X] | [1-sentence note] |
| Expertise | [X] | [1-sentence note] |
| Authoritativeness | [X] | [1-sentence note] |
| Trustworthiness | [X] | [1-sentence note] |
| **Overall** | **[avg]** | |

YMYL: [Yes/No] | Priority: [High/Medium/Low]
```

### Interpretation

| Average Score | Rating | Action |
|:---:|--------|--------|
| 4.5-5.0 | Excellent | Monitor, maintain |
| 3.5-4.4 | Good | Minor improvements |
| 2.5-3.4 | Needs work | Targeted fixes |
| 1.5-2.4 | Poor | Major overhaul needed |
| 1.0-1.4 | Critical | Rewrite or remove |

---

## Fix Recommendations

### Experience Fixes (Low → High)

| Current Score | Actions |
|:---:|---------|
| 1-2 | Add first-person perspective, include specific examples and case studies |
| 2-3 | Add original images/screenshots, include measurable results from personal experience |
| 3-4 | Add detailed case studies with data, document testing methodology, share unique insights |

### Expertise Fixes (Low → High)

| Current Score | Actions |
|:---:|---------|
| 1-2 | Add author byline and bio, fix factual errors, add citations |
| 2-3 | Expand author bio with credentials, increase content depth, add expert quotes |
| 3-4 | Link to author's other published work, add schema Person markup, get content peer-reviewed |

### Authoritativeness Fixes (Low → High)

| Current Score | Actions |
|:---:|---------|
| 1-2 | Focus site on specific topic area, build topical content depth |
| 2-3 | Pursue mentions/links from industry publications, add Organization schema |
| 3-4 | Contribute to industry publications, build partnerships, pursue speaking/citations |

### Trustworthiness Fixes (Low → High)

| Current Score | Actions |
|:---:|---------|
| 1-2 | Add HTTPS, contact info, about page, privacy policy. Remove deceptive elements |
| 2-3 | Add editorial policy, cite all claims, clearly label sponsored content |
| 3-4 | Add fact-checking process, display trust badges, improve transparency |
