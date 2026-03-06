---
name: Trader
description: Swing trading analysis for equities and crypto. USE WHEN evaluating setups, reviewing positions, trade planning, journaling, or research. Triggers on "trade", "setup", "position", "chart", "breakout", "pattern".
---

# Trader - Master Trading Skill

**Routes when user mentions trades, setups, positions, charts, patterns, or brokerage operations.**

---

## Sub-Skill Routing

| Trigger | Route To | Purpose |
|---------|----------|---------|
| portfolio, quote, schwab, account, order, buy, sell | `Schwab/SKILL.md` | Brokerage operations |
| market data, historical, aggregates, indicators, sma, rsi, macd | `Massive/SKILL.md` | Market data API |
| setup, pattern, breakout, chart, evaluate | This file | Technical analysis |
| journal, log trade | This file + `Data/JOURNAL.md` | Trade logging |
| watchlist | This file + `Data/WATCHLIST.md` | Ticker monitoring |
| positions, holdings | This file + `Data/POSITIONS.md` | Position management |

---

## Directory Structure

```
~/.claude/skills/Trader/
├── SKILL.md              # This file - master routing + methodology
├── Schwab/               # Brokerage integration
│   ├── SKILL.md
│   ├── schwab_client.py
│   └── auth.py
├── Massive/              # Market data API
│   ├── SKILL.md
│   ├── massive_client.py # REST API wrapper
│   └── flat_files.py     # S3 bulk data downloader
├── Data/
│   ├── WATCHLIST.md      # Tickers being monitored
│   ├── POSITIONS.md      # Open positions
│   └── JOURNAL.md        # Trade log
├── PLAYBOOK.md           # Pattern definitions
└── Research/             # Per-ticker notes
    └── [TICKER].md
```

---

## Trading Philosophy

| Principle | Description |
|-----------|-------------|
| **Style** | Swing trading (days to weeks, sometimes months) |
| **Direction** | Long only - NO shorts |
| **Markets** | Equities and Crypto |
| **Edge** | Price action + pattern breakouts from extended consolidation |

**What I DON'T do:**
- Day trading / Scalping
- Short selling
- Options trading
- Leverage/margin

---

## Required Indicators

### 1. Ichimoku Cloud
- **Trend**: Price above/below cloud
- **S/R**: Cloud edges (Senkou Span A/B)
- **Momentum**: Tenkan/Kijun cross
- **Future**: Kumo twist

### 2. Pivot Points
- Monthly and weekly pivots
- Target setting and stop placement

### 3. Moving Averages (20/50/200)
| MA | Purpose |
|----|---------|
| 20 | Near-term trend, entry timing |
| 50 | Intermediate trend |
| 200 | Major trend direction |

**Ideal**: Price > 20 > 50 > 200

### 4. Williams Fractals
- Swing highs/lows
- Breakout confirmation
- Stop placement

---

## Preferred Patterns

| Pattern | Type | Signal |
|---------|------|--------|
| Inverse H&S | Reversal | Neckline break |
| Cup & Handle | Continuation | Handle breakout |
| Falling Wedge | Both | Upper line break |
| Adam & Eve | Reversal | Neckline break |
| Ascending Triangle | Continuation | Resistance break |
| Bull Flag | Continuation | Flag break |

**See `PLAYBOOK.md` for detailed definitions.**

### Consolidation Requirements
- Minimum 4+ weeks
- Decreasing volume
- Tightening range
- Clean, obvious structure

---

## Setup Scoring (1-10)

| Criterion | Weight |
|-----------|--------|
| Pattern Clarity | 2x |
| Consolidation Length | 1.5x |
| Indicator Alignment | 1.5x |
| Risk/Reward | 2x |
| Volume Profile | 1x |
| Trend Context | 1x |

**Interpretation:**
- 8-10: A+ setup, full size
- 6-7: Solid, standard size
- 4-5: Marginal, reduce or pass
- <4: No trade

---

## Position Sizing

```
Size = (Account Risk %) / (Stop Distance %)
```

**Risk Rules:**
- Max per trade: 1-2%
- Max position: 10% of account
- Max correlated: 20%

---

## Workflow Commands

| Command | Action |
|---------|--------|
| "Evaluate [TICKER] setup" | Score against criteria |
| "Review positions" | Check vs stops/targets |
| "Plan trade for [TICKER]" | Entry/stop/target with R:R |
| "Log trade [TICKER]" | Journal entry |
| "Research [TICKER]" | Fundamentals + catalysts |
| "Show watchlist" | Current monitoring list |

---

## Integration: Schwab

Full brokerage access via `Schwab/` sub-skill:

```python
from schwab_client import SchwabClient
client = SchwabClient()

# Account operations
client.get_positions("brokerage")
client.get_account("brokerage")
client.get_portfolio_summary()

# Market data
client.get_quote("NVDA")
client.get_quotes(["AAPL", "MSFT", "GOOGL"])

# Orders (dry_run=True by default)
client.place_limit_order(symbol, qty, price, dry_run=True)
```

**See `Schwab/SKILL.md` for full API documentation.**

---

## Integration: Massive (Market Data)

Historical data, real-time quotes, and technical indicators via `Massive/` sub-skill:

```python
from massive_client import MassiveClient
client = MassiveClient()

# OHLC Aggregates
bars = client.get_aggregates("AAPL", "day", "2024-01-01", "2024-12-31")
daily = client.get_daily_bars("NVDA", days=252)

# Real-time Data
snapshot = client.get_snapshot("TSLA")
quote = client.get_quote("MSFT")

# Technical Indicators
sma_20 = client.get_sma("AAPL", window=20)
rsi = client.get_rsi("NVDA", window=14)
macd = client.get_macd("TSLA")

# Trading Helper
alignment = client.check_ma_alignment("AAPL")  # Returns bullish_stack status

# Crypto
btc_bars = client.get_crypto_aggregates("BTC", "USD", "day")
```

**Bulk Downloads (Flat Files):**
```python
from flat_files import MassiveFlatFiles
downloader = MassiveFlatFiles()

# Download daily aggregates
downloader.download_day_aggs("2024-01-01", "2024-01-31")

# Load into pandas
df = downloader.load_day_aggs_csv("2024-01-15", ticker="AAPL")
```

**See `Massive/SKILL.md` for full API documentation.**

---

## Response Format

```
## [TICKER] Setup Analysis

**Pattern**: [Name]
**Timeframe**: [Daily/Weekly]
**Consolidation**: [Duration]

### Indicators
- Ichimoku: [Status]
- MAs: [Alignment]
- Pivots: [Key levels]
- Fractals: [Swing points]

### Levels
- Entry: $XX.XX
- Stop: $XX.XX (reason)
- T1: $XX.XX (reason)
- T2: $XX.XX (reason)
- R:R: X.X:1

### Score: X/10

### Recommendation
[PASS / WATCHLIST / ENTER]
```
