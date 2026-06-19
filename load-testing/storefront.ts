import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

const STORES = Array.from({ length: 100 }, (_, i) => ({
  tenantId: `tenant_${i}`,
  subdomain: `store${i}.localhost`,
}));

export default function () {
  const store = STORES[__VU % STORES.length];

  const headers = { "x-tenant-id": store.tenantId, Host: store.subdomain };

  // Browse homepage
  const home = http.get(`${BASE}/`, { headers });
  check(home, { "homepage loads": (r) => r.status === 200 });

  // Search products
  const search = http.get(`${BASE}/api/v1/products?search=shirt&page=1&pageSize=20`, { headers });
  check(search, { "search returns 200": (r) => r.status === 200 });

  // View a category
  const cat = http.get(`${BASE}/api/v1/categories`, { headers });
  check(cat, { "categories load": (r) => r.status === 200 });

  sleep(Math.random() * 3 + 1);
}
