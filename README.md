# HotsTrends

A clean web application that aggregates the **hottest tech news** from **Hacker News and NewsAPI** with velocity-based hotness scoring.

> **Note:** This app is specifically focused on technology news. **Hacker News** provides community-curated tech content with engagement signals, while **NewsAPI** delivers breaking headlines from major mainstream tech publications.

## Features

- **Multiple Sources**: Hacker News (Top, Best, New, Ask HN, Show HN) + NewsAPI integration
- **Velocity-Based Hotness**: Stories ranked by engagement speed, not just total points
- **Real-Time Metrics**: Points, comments, and pts/hr displayed on every card
- **Trending Topics**: Word cloud sidebar showing what tech is talking about NOW
- **AI Smart Summaries**: OpenAI-powered summaries explaining why each story matters
- **Clean Design**: Clean, readable interface with classic styling
- **Responsive**: Works on desktop, tablet, and mobile devices

---

## How "Hotness" Is Calculated

The app uses different sorting strategies based on the data source. For **Hacker News**, we implement a custom velocity algorithm. For **NewsAPI**, we rely on their "Top Headlines" relevance sorting.

### Velocity Scoring (Hacker News Only)

For HN content, we go beyond simple point counts. Here's how each metric works:

### Points (e.g., "1,704 points")
- **What it is**: Total upvotes the story has received from the Hacker News community
- **Source**: Directly from the HN API `score` field
- **Why it matters**: Higher points = more people found it interesting

### Points Per Hour (e.g., "🔥 85 pts/hr")
- **What it is**: Velocity = `total_points / hours_since_posted`
- **Why it matters**: A story with 50 points in 30 minutes is HOTTER than one with 200 points in 24 hours
- **Formula**: 
  ```
  velocity = points / hours_old
  hotness_score = velocity × recency_multiplier
  ```
  Where `recency_multiplier` = 3x for stories < 1 hour old, decaying to 1x at 8 hours

### Hotness Levels
| Badge | Threshold | Meaning |
|-------|-----------|---------|
| 🔥 Fire | score ≥ 100 | Viral - extremely rapid engagement |
| 🔥 Hot | score ≥ 50 | Trending - gaining points quickly |
| 📈 Warm | score ≥ 20 | Rising - noticeable velocity |
| 🆕 Fresh | score ≥ 5 + < 2hrs old | New but promising |

### Comments (e.g., "672 comments")
- **What it is**: Number of discussion comments on Hacker News
- **Source**: HN API `descendants` field
- **Why it matters**: High comment counts often indicate controversial or deeply engaging content

### Trending Topics
- **What it is**: Keywords extracted from all story titles, weighted by frequency and points
- **How it works**:
  1. Extract words from all 30 story titles
  2. Filter out common stop words ("the", "a", "is", etc.)
  3. Weight by: `count × (1 + log(avg_points)) × tech_bonus`
  4. **Tech Bonus**: Keywords like "AI", "Rust", "Crypto" get a 1.5x score multiplier
  5. Display larger tags for higher-weight topics

---

## How to Run Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HotsTrends
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys (optional)**
   ```bash
   cp .env.example .env
   # Edit .env and add: NEWS_API_KEY=your_news_API_Key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**: `http://localhost:5173`

## API Keys Needed

| API | Required | Free Tier | Get Key |
|-----|----------|-----------|---------|
| Hacker News | ❌ No key needed | Unlimited | N/A |
| NewsAPI.org | Optional | 100 req/day | [newsapi.org/register](https://newsapi.org/register) |
| OpenAI | Optional | Pay-per-use | [platform.openai.com](https://platform.openai.com/api-keys) |

### Enabling AI Summaries

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file: `VITE_OPENAI_API_KEY=sk-your-key-here`
3. Restart the dev server
4. AI summaries are enabled by default

> **Cost:** AI summaries use GPT-3.5-turbo (~$0.001 per 10 summaries)

---

## Approach and Tradeoffs

### Why Velocity-Based Scoring?

Traditional news aggregators sort by total points, which favors older content. Our approach:

1. **Velocity matters**: `points_per_hour` surfaces stories gaining momentum NOW
2. **Recency boost**: Fresh stories get a multiplier (3x for <1hr, decaying over 8hrs)
3. **Multiple signals**: Combines velocity + comments + recency for true "hotness"

### Architecture Decisions

| Decision | Benefit | Tradeoff |
|----------|---------|----------|
| Vanilla JS + Vite | Small bundle (~15KB), fast load | More boilerplate than React |
| Hacker News API | Free, no auth, trusted community | Community-curated content |
| NewsAPI Integration | Broad coverage of major outlets | Requires API key for production |
| Client-side scoring | Real-time, no backend needed | Recalculates on each load |
| CSS Custom Properties | Easy theming, maintainable | Slightly more verbose |

---

## AI Tools Used

I used Antigravity for the code IDE, GPT/Grok for research, and OpenAI endpoints for news summarization.

1. **Architecture** - Designed velocity-based hotness algorithm and component structure
2. **Code Generation** - Modular, documented JavaScript following best practices
3. **Hotness Algorithm** - Implemented the pts/hr calculation with recency multiplier and tech keyword boosting
4. **Research** - Used GPT and Grok to refine the approach and features

---

## Project Structure

```
HotsTrends/
├── index.html
├── src/
│   ├── main.js                 # Entry point
│   ├── app/App.js              # Main controller
│   ├── services/
│   │   ├── hackerNewsService.js    # HN API + hotness scoring
│   │   ├── newsApiService.js       # NewsAPI integration
│   │   └── openaiService.js        # AI summary generation
│   ├── components/
│   │   ├── Header.js           # App header
│   │   ├── FilterBar.js        # Source/filter dropdowns
│   │   ├── NewsCard.js         # Story card with hotness badge
│   │   ├── NewsList.js         # List container
│   │   ├── TrendingTopics.js   # Sidebar word cloud
│   │   └── Loader.js           # Loading states
│   ├── utils/
│   │   ├── helpers.js          # Formatting utilities
│   │   └── hotness.js          # Velocity calculation algorithm
│   └── styles/index.css        # Design system
├── .env.example
├── package.json
└── README.md
```

---



## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## License

MIT

---

Built with 
- [Hacker News API](https://github.com/HackerNews/API)
- [NewsAPI.org](https://newsapi.org)
- [OpenAI](https://openai.com)
- [Vite](https://vite.dev)
