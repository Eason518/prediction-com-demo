"""
Prediction.com Demo — FastAPI Backend
All API calls to prediction.com are proxied here; the key never leaves the server.
"""
import os
import asyncio
import httpx
from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request
from websockets.asyncio.client import connect as websockets_connect
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

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET",
}

# Global handler: ensure CORS headers survive uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=CORS_HEADERS,
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=CORS_HEADERS,
    )


def prediction_headers() -> dict:
    if not API_KEY:
        raise HTTPException(status_code=500, detail="PREDICTION_API_KEY not set")
    return {"X-API-Key": API_KEY}


async def proxy_get(path: str, params: dict | None = None) -> dict:
    """Single shared httpx call with upstream error forwarding."""
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
    if r.status_code >= 400:
        # forward upstream error body so the frontend can display it
        try:
            body = r.json()
        except Exception:
            body = {"detail": r.text}
        raise HTTPException(status_code=r.status_code, detail=body)
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


# ── Kalshi markets catalog ─────────────────────────────────────────────────────
@app.get("/api/kalshi/markets")
async def get_kalshi_markets(
    status: str | None = None,
    category: str | None = None,
    event_ticker: str | None = None,
    series_ticker: str | None = None,
    tickers: str | None = None,
    limit: int = Query(100, ge=1, le=1000),
    cursor: str | None = None,
):
    return await proxy_get("/kalshi/markets", {
        "status": status,
        "category": category,
        "event_ticker": event_ticker,
        "series_ticker": series_ticker,
        "tickers": tickers,
        "limit": limit,
        "cursor": cursor,
    })


# ── Kalshi single market ───────────────────────────────────────────────────────
@app.get("/api/kalshi/markets/{ticker:path}")
async def get_kalshi_market(ticker: str):
    return await proxy_get(f"/kalshi/markets/{ticker}")


# ── Trades ─────────────────────────────────────────────────────────────────────
@app.get("/api/trades")
async def get_trades(
    platform: str | None = None,
    market_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    order: str = "desc",
    pagination_key: str | None = None,
):
    return await proxy_get("/trades", {
        "platform": platform,
        "market_id": market_id,
        "limit": limit,
        "order": order,
        "pagination_key": pagination_key,
    })


# ── Arb opportunities ──────────────────────────────────────────────────────────
@app.get("/api/arb")
async def get_arb(limit: int = Query(20, ge=1, le=100)):
    return await proxy_get("/arb", {"limit": limit})


# ── EV opportunities ───────────────────────────────────────────────────────────
@app.get("/api/ev")
async def get_ev(limit: int = Query(20, ge=1, le=100)):
    return await proxy_get("/ev", {"limit": limit})


# ── Smart money alerts ─────────────────────────────────────────────────────────
@app.get("/api/alerts/smart-money")
async def get_smart_money(
    alert_type: str = "all",
    limit: int = Query(20, ge=1, le=100),
    platform: str | None = None,
):
    return await proxy_get("/alerts/smart-money", {
        "alert_type": alert_type,
        "limit": limit,
        "platform": platform,
    })


# ── Fade finder alerts ─────────────────────────────────────────────────────────
@app.get("/api/alerts/fade-finder")
async def get_fade_finder(
    limit: int = Query(20, ge=1, le=100),
    platform: str | None = None,
):
    return await proxy_get("/alerts/fade-finder", {
        "limit": limit,
        "platform": platform,
    })


# ── Prices bulk ────────────────────────────────────────────────────────────────
@app.get("/api/prices/bulk")
async def get_prices_bulk(ids: str = Query(..., description="Comma-separated platform:market_id pairs")):
    return await proxy_get("/prices/bulk", {"ids": ids})


# ── WebSocket proxy ────────────────────────────────────────────────────────────
# Frontend connects here; backend relays to predictionhunt with the real API key
WS_UPSTREAM = "wss://ws.predictionhunt.com"

@app.websocket("/ws")
async def websocket_proxy(client: WebSocket):
    await client.accept()
    if not API_KEY:
        await client.send_json({"type": "error", "code": "NO_KEY", "message": "API key not configured"})
        await client.close()
        return
    try:
        async with websockets_connect(f"{WS_UPSTREAM}?api_key={API_KEY}") as upstream:
            async def client_to_upstream():
                while True:
                    try:
                        data = await client.receive_text()
                        await upstream.send(data)
                    except WebSocketDisconnect:
                        break
                    except Exception:
                        break

            async def upstream_to_client():
                async for message in upstream:
                    try:
                        text = message if isinstance(message, str) else message.decode()
                        await client.send_text(text)
                    except Exception:
                        break

            tasks = [
                asyncio.create_task(client_to_upstream()),
                asyncio.create_task(upstream_to_client()),
            ]
            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for t in pending:
                t.cancel()
    except Exception as e:
        try:
            await client.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await client.close()
        except Exception:
            pass
