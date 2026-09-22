# Prediction.com Demo

A full-stack dashboard for exploring [Prediction.com API](https://prediction.com/api/docs) data across 8 prediction market platforms.

## Stack

- **Backend**: FastAPI (Python) — keeps API key server-side
- **Frontend**: React + Vite + TypeScript

## Quick Start

```bash
# 1. Backend
cd backend
cp ../.env.example .env       # fill in PREDICTION_API_KEY
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Pages

| Page | Endpoint | Description |
|------|----------|-------------|
| Dashboard | `/status` + `/rate-limit` | Platform health + quota usage |
| Markets | `/markets` | Filterable paginated market list |
| Search | `/search` | Keyword → cross-platform events view |
| Events | `/events` | Event list with cross-platform groups |
| Cross-Platform | `/search` + `/prices/bulk` | Side-by-side price comparison |
| Price Bulk | `/prices/bulk` | Batch price snapshot by market IDs |

## Tier Notes

- **Free tier** ($0): all pages above work within 1,000 req/mo
- **Dev tier** ($49/mo): unlocks WebSocket Live Feed, Smart Money, Fade Finder
- **Pro tier** ($249/mo): unlocks Arbitrage + EV signals, full Orderbook
