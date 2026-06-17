import { describe, it, expect, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  it("logs info messages", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test message", { requestId: "req-1" });
    expect(spy).toHaveBeenCalledOnce();
    const call = spy.mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("test message");
    expect(parsed.requestId).toBe("req-1");
    spy.mockRestore();
  });

  it("logs error messages", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("error message", { error: "Something broke" });
    expect(spy).toHaveBeenCalledOnce();
    const call = spy.mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe("error");
    expect(parsed.error).toBe("Something broke");
    spy.mockRestore();
  });
});
