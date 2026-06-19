# Load Testing

Scripts for scale testing CloudCommerce at 10k+ stores.

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/)
- Dev server running: `bun run dev`

## Scripts

| Script | Target | Description |
|--------|--------|-------------|
| `smoke.ts` | API | Minimal test (1 VU, 30s) — quick sanity check |
| `storefront.ts` | Storefront | Simulates customer browsing — homepage → category → product |
| `merchant-api.ts` | Merchant API | CRUD operations on products, orders, customers |
| `realtime.ts` | WebSocket | Simulates dashboard WebSocket connections + event stream |
| `combined.ts` | All | Mixes all traffic patterns for realistic multi-tenant load |

## Usage

```bash
# Smoke test
k6 run load-testing/smoke.ts

# Storefront traffic (100 concurrent customers)
k6 run --vus 100 --duration 5m load-testing/storefront.ts

# Merchant API traffic (50 concurrent merchants)
k6 run --vus 50 --duration 10m load-testing/merchant-api.ts

# WebSocket realtime (200 dashboard connections)
k6 run --vus 200 --duration 5m load-testing/realtime.ts

# Combined realistic load
k6 run --vus 200 --duration 15m load-testing/combined.ts
```

## Key Metrics

- `http_req_duration` — p95 < 500ms for API, p95 < 200ms for cache hits
- `http_req_failed` — < 1%
- `ws_connects` — all should succeed
- `ws_msgs_received` — heartbeat should arrive every 30s
- `queue_depth` — no backlog growth (check via `/api/v1/metrics`)
