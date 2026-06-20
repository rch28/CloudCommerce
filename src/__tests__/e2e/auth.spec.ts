import { test, expect } from "@playwright/test";

test.describe("Auth API", () => {
  const ts = Date.now();

  test("POST /api/auth/register - registers a new user", async () => {
    const email = `new-${ts}@test.com`;
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "New User", role: "merchant" }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe(email);
  });

  test("POST /api/auth/register - rejects duplicate email", async () => {
    const email = `dupe-${ts}@test.com`;
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "Dupe", role: "merchant" }),
    });
    expect(res.ok).toBe(true);
    const dupe = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "other123", name: "Dupe Again", role: "merchant" }),
    });
    expect(dupe.status).toBe(409);
  });

  test("POST /api/auth/login - logs in with correct credentials", async () => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@demo.com", password: "merchant123" }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.user.email).toBe("merchant@demo.com");
  });

  test("POST /api/auth/login - rejects wrong password", async () => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@demo.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me - returns current user", async () => {
    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@demo.com", password: "merchant123" }),
    });
    const cookies = login.headers.get("set-cookie") || "";
    const res = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Cookie: cookies },
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.loggedIn).toBe(true);
  });

  test("GET /api/auth/me - returns not logged in without cookie", async () => {
    const res = await fetch("http://localhost:3000/api/auth/me");
    const body = await res.json();
    expect(body.loggedIn).toBe(false);
  });

  test("POST /api/auth/logout - clears session", async () => {
    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "merchant@demo.com", password: "merchant123" }),
    });
    const cookies = login.headers.get("set-cookie") || "";
    const res = await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Cookie: cookies },
    });
    expect(res.ok).toBe(true);
    const me = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Cookie: cookies },
    });
    const meBody = await me.json();
    expect(meBody.loggedIn).toBe(false);
  });
});
