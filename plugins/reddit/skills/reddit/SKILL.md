---
name: Reddit
description: Reddit API integration via PRAW. USE WHEN user asks about Reddit posts, subreddits, users, search Reddit, monitor discussions, post content, comment, vote, or any Reddit operations.
---

# Reddit

Full Reddit integration using PRAW (Python Reddit API Wrapper). Primary use: research and intelligence gathering. Secondary: posting, commenting, and engagement when needed.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Direct API** | All operations | Uses `reddit_client.py` directly |

## API Capabilities

### Read Operations

| Action | Method | Notes |
|--------|--------|-------|
| Subreddit info | `get_subreddit(name)` | Description, subscribers, rules |
| Subreddit posts | `get_subreddit_posts(name, sort, limit)` | hot/new/top/rising |
| Search subreddit | `search_subreddit(name, query, limit)` | Search within subreddit |
| User info | `get_user(username)` | Profile, karma, account age |
| User posts | `get_user_posts(username, limit)` | User's submissions |
| User comments | `get_user_comments(username, limit)` | Comment history |
| Current user | `get_me()` | Authenticated user info |
| Search posts | `search_posts(query, subreddit, sort, time_filter, limit)` | Global search |
| Search subreddits | `search_subreddits(query)` | Find communities |
| Post details | `get_post(post_id)` | Full post info |
| Post comments | `get_post_comments(post_id, limit, sort)` | Comments tree |
| Popular subreddits | `get_popular_subreddits(limit)` | Trending |

### Write Operations

| Action | Method | Notes |
|--------|--------|-------|
| Text post | `submit_text_post(subreddit, title, body)` | Create self post |
| Link post | `submit_link_post(subreddit, title, url)` | Create link post |
| Comment on post | `reply_to_post(post_id, body)` | Top-level comment |
| Reply to comment | `reply_to_comment(comment_id, body)` | Nested reply |
| Upvote | `upvote(thing_id)` | Upvote post/comment |
| Downvote | `downvote(thing_id)` | Downvote post/comment |
| Clear vote | `clear_vote(thing_id)` | Remove vote |
| Subscribe | `subscribe(subreddit)` | Join subreddit |
| Unsubscribe | `unsubscribe(subreddit)` | Leave subreddit |

---

## Examples

**Example 1: Research a topic**
```
User: "What are people saying about Claude on Reddit?"
→ search_posts("Claude AI", sort="relevance", time_filter="month")
→ Returns recent discussions with titles, scores, comment counts
```

**Example 2: Get subreddit info**
```
User: "Tell me about r/LocalLLaMA"
→ get_subreddit("LocalLLaMA")
→ Returns subscriber count, description, rules
→ get_subreddit_posts("LocalLLaMA", sort="hot", limit=10)
→ Returns current hot posts
```

**Example 3: User profile lookup**
```
User: "Look up u/spez on Reddit"
→ get_user("spez")
→ Returns karma, account age, recent activity
```

**Example 4: Post to Reddit**
```
User: "Post my project to r/SideProject"
→ submit_text_post("SideProject", "Title here", "Body content")
→ Returns post URL and ID
```

**Example 5: Monitor discussions**
```
User: "Find discussions about PRAW in r/learnpython"
→ search_subreddit("learnpython", "PRAW", limit=20)
→ Returns relevant posts for review
```

---

## Authentication

**Credentials:** `~/.reddit-credentials` (chmod 600)
```
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
REDDIT_USERNAME=xxx
REDDIT_PASSWORD=xxx
REDDIT_USER_AGENT=PAI:Reddit:1.0 (by u/username)
```

**Account:** u/thekarmasaur

---

## Files

```
~/.claude/skills/Reddit/
├── SKILL.md              # This file
├── reddit_client.py      # PRAW wrapper
├── Tools/                # CLI tools (reserved)
└── .gitignore
```

---

## Usage

```python
from reddit_client import RedditClient

client = RedditClient()

# Read
print(client.get_subreddit("python"))
print(client.search_posts("machine learning", limit=10))
print(client.get_user("spez"))

# Write
client.submit_text_post("test", "Hello", "World")
client.upvote("t3_abc123")
```
