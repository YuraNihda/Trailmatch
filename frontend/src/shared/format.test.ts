import { describe, expect, it } from "vitest";
import { ApiError, messageFor } from "../api/errors";
import { formatPrice, isPast } from "./format";

describe("format", () => {
  it("formats price in UAH with spaces", () => expect(formatPrice(2200)).toBe("₴2 200"));
  it("detects past dates", () => {
    expect(isPast("2000-01-01")).toBe(true);
    expect(isPast("2999-01-01")).toBe(false);
  });
});

describe("messageFor", () => {
  it("maps backend error codes to Ukrainian text, never raw server text", () => {
    expect(messageFor(new ApiError(409, "conflict", "Not enough free seats"))).toContain("місць");
    expect(messageFor(new Error("boom"))).not.toContain("boom");
  });
});
