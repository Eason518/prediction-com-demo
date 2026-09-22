"""
Prediction.com Demo — FastAPI Backend
All API calls to prediction.com are proxied here; the key never leaves the server.
"""
import os
import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("PREDICTION_API_KEY", "")
BASE_URL = "https://prediction.com/api/v2"

app = FastAPI(title="Prediction.com Demo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def prediction_headers() -> dict:
    if not API_KEY:
        raise HTTPException(status_code=500, detail="PREDICTION_API_KEY not set")
    return {"X-API-Key": API_KEY}


async def proxy_get(path: str, params: dict | None = None) -> dict:
    """Single shared httpx call with rate-limit headers forwarded."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(
            f"{BASE_URL}{path}",
            headers=prediction_headers(),
            params={k: v for k, v in (params or {}).items() if v is not None},
        )
    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if r.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return r.json()


# ── Status (no auth needed upstream, but we still proxy) ──────────────────────
@app.get("/api/status")
async def get_status():
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{BASE_URL}/status")
    return r.json()


# ── Rate limit ─────────────────────────────────────────────────────────────────
@app.get("/api/rate-limit")
async def get_rate_limit():
    return await proxy_get("/rate-limit")


# ── Markets ────────────────────────────────────────────────────────────────────
@app.get("/api/markets")
async def get_markets(
    platform: str | None = None,
    status: str = "active",
    category: str | None = None,
    q: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = None,
):
    return await proxy_get("/markets", {
        "platform": platform,
        "status": status,
        "category": category,
        "q": q,
        "limit": limit,
        "cursor": cursor,
    })


# ── Events ─────────────────────────────────────────────────────────────────────
@app.get("/api/events")
async def get_events(
    event_type: str | None = None,
    status: str | None = None,
    q: str | None = None,
    include_groups: bool = True,
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
):
    return await proxy_get("/events", {
        "event_type": event_type,
        "status": status,
        "q": q,
        "include_groups": str(include_groups).lower(),
        "limit": limit,
        "cursor": cursor,
    })


# ── Search ─────────────────────────────────────────────────────────────────────
@app.get("/api/search")
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    return await proxy_get("/search", {"q": q, "limit": limit})


# ── Prices bulk ────────────────────────────────────────────────────────────────
@app.get("/api/prices/bulk")
async def get_prices_bulk(ids: str = Query(..., description="Comma-separated platform:market_id pairs")):
    return await proxy_get("/prices/bulk", {"ids": ids})
