import { describe, expect, it } from "vitest";

describe("Paystack public-key configuration", () => {
  it("uses a live publishable key and Paystack Inline JS is reachable", async () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    expect(publicKey).toMatch(/^pk_live_[A-Za-z0-9]+$/);

    const response = await fetch("https://js.paystack.co/v1/inline.js");
    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type") || "").toMatch(/javascript|text/i);
  });

  it("does not treat the browser public key as a server secret", async () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    expect(publicKey).toMatch(/^pk_live_/);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${publicKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "paystack-public-key-check@example.com", amount: 100 }),
    });
    expect(response.status).toBe(401);
  });
});
