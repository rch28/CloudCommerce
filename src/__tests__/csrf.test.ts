import { describe, it, expect } from "vitest";
import { generateCSRFToken, validateCSRFToken } from "@/lib/security/csrf";

describe("CSRF", () => {
  it("generates a valid token", () => {
    const token = generateCSRFToken("session-123");
    expect(token).toBeTruthy();
    expect(token.length).toBe(64);
  });

  it("validates the correct token", () => {
    const token = generateCSRFToken("session-123");
    expect(validateCSRFToken(token, "session-123")).toBe(true);
  });

  it("rejects an invalid token", () => {
    const token = generateCSRFToken("session-123");
    expect(validateCSRFToken(token, "session-456")).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = generateCSRFToken("session-123");
    const tampered = "a" + token.slice(1);
    expect(validateCSRFToken(tampered, "session-123")).toBe(false);
  });
});
