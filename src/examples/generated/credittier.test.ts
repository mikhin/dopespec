import { describe, it, expect } from "vitest";
import { evaluateCreditTier } from "./credittier.evaluate.js";

describe("CreditTier", () => {
  it('when extraItemId = "tier_3", then credits = 5', () => {
    const result = evaluateCreditTier({ amount: 0, extraItemId: "tier_3" });
    expect(result).toEqual({ credits: 5 });
  });

  it('when extraItemId = "tier_5", then credits = 10', () => {
    const result = evaluateCreditTier({ amount: 0, extraItemId: "tier_5" });
    expect(result).toEqual({ credits: 10 });
  });

  it('when extraItemId = "tier_12", then credits = 30', () => {
    const result = evaluateCreditTier({ amount: 0, extraItemId: "tier_12" });
    expect(result).toEqual({ credits: 30 });
  });
});
