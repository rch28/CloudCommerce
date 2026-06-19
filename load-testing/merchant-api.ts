import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const failureRate = new Rate("api_errors");

export const options = {
  thresholds: {
    api_errors: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

const MERCHANTS = Array.from({ length: 50 }, (_, i) => ({
  tenantId: `tenant_${i}`,
  sessionToken: `session_mock_${i}`,
}));

export default function () {
  const merchant = MERCHANTS[__VU % MERCHANTS.length];

  const headers = {
    "x-tenant-id": merchant.tenantId,
    Cookie: `cc_session_token=${merchant.sessionToken}`,
    "Content-Type": "application/json",
  };

  // List products
  const products = http.get(`${BASE}/api/v1/products?page=1&pageSize=20`, { headers });
  check(products, { "list products": (r) => r.status === 200 }) || failureRate.add(1);

  // List orders
  const orders = http.get(`${BASE}/api/v1/orders?page=1&pageSize=20`, { headers });
  check(orders, { "list orders": (r) => r.status === 200 }) || failureRate.add(1);

  // List customers
  const customers = http.get(`${BASE}/api/v1/customers?page=1&pageSize=20`, { headers });
  check(customers, { "list customers": (r) => r.status === 200 }) || failureRate.add(1);

  // Create product (every 5th request)
  if (__ITER % 5 === 0) {
    const createRes = http.post(
      `${BASE}/api/v1/products`,
      JSON.stringify({
        name: `Load Test Product ${__VU}-${__ITER}`,
        slug: `load-test-${__VU}-${__ITER}`,
        status: "active",
        images: [],
        variants: [{ sku: `SKU-${__VU}-${__ITER}`, price: 19.99, quantity: 100, isDefault: true, status: "active" }],
        options: [],
      }),
      { headers },
    );
    check(createRes, { "create product": (r) => r.status >= 200 && r.status < 300 }) || failureRate.add(1);
  }

  sleep(Math.random() * 2 + 0.5);
}
