import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const result = rateLimit("test-key", { maxRequests: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, { maxRequests: 1, windowMs: 60_000 });
    const result = rateLimit(key, { maxRequests: 1, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns correct remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    const first = rateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    expect(first.remaining).toBe(4);
    const second = rateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    expect(second.remaining).toBe(3);
  });
});
