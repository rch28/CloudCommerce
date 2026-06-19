import { check, sleep, group } from "k6";
import http from "k6/http";
import ws from "k6/ws";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "5m", target: 200 },
    { duration: "3m", target: 500 },
    { duration: "5m", target: 200 },
  ],
  thresholds: {
    errors: ["rate<0.05"],
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const WS_URL = __ENV.WS_URL || "ws://localhost:3001";

const TOTAL_STORES = 500;

function pickStore() {
  const i = (__VU + __ITER) % TOTAL_STORES;
  return {
    tenantId: `tenant_${i}`,
    subdomain: `store${i}.localhost`,
    sessionToken: `session_mock_${i}`,
  };
}

function storefrontScenario() {
  const store = pickStore();
  const headers = { "x-tenant-id": store.tenantId, Host: store.subdomain };

  group("storefront", () => {
    const r1 = http.get(`${BASE}/`, { headers });
    check(r1, { "homepage": (r) => r.status === 200 }) || errorRate.add(1);

    const r2 = http.get(`${BASE}/api/v1/categories`, { headers });
    check(r2, { "categories": (r) => r.status === 200 }) || errorRate.add(1);

    const r3 = http.get(`${BASE}/api/v1/products?page=1&pageSize=20`, { headers });
    check(r3, { "products": (r) => r.status === 200 }) || errorRate.add(1);
  });
}

function merchantScenario() {
  const store = pickStore();
  const headers = {
    "x-tenant-id": store.tenantId,
    "Content-Type": "application/json",
    Cookie: `cc_session_token=${store.sessionToken}`,
  };

  group("merchant", () => {
    const r1 = http.get(`${BASE}/merchant/dashboard`, { headers });
    check(r1, { "dashboard": (r) => r.status < 500 }) || errorRate.add(1);

    const r2 = http.get(`${BASE}/api/v1/orders?page=1&pageSize=10&status=pending`, { headers });
    check(r2, { "pending orders": (r) => r.status === 200 }) || errorRate.add(1);
  });
}

export default function () {
  const scenario = __VU % 3;

  if (scenario === 0) {
    storefrontScenario();
  } else if (scenario === 1) {
    const store = pickStore();
    const url = `${WS_URL}?token=${store.sessionToken}`;
    ws.connect(url, {}, () => {});
    merchantScenario();
  } else {
    merchantScenario();
  }

  sleep(Math.random() * 3 + 1);
}
