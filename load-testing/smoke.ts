import { check } from "k6";
import http from "k6/http";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE}/api/v1/health`);
  check(res, {
    "health endpoint responds": (r) => r.status === 200,
    "status is healthy": (r) => r.json()?.status === "healthy",
  });
}
