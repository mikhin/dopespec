import { describe, it, expect } from "vitest";
import type { PetProps } from "./pet.types.js";
import { PetRelease, PetReserve, PetSell } from "./pet.transitions.js";

describe("Pet", () => {
  it('given {"price":25}, when release, then status = available', () => {
    const ctx = {
      name: "",
      price: 25,
      species: "dog",
      vaccinated: false,
      status: "reserved",
    } satisfies PetProps;
    const result = PetRelease(ctx);
    expect(result.status).toBe("available");
  });

  it('given {"vaccinated":true}, when reserve, then status = reserved', () => {
    const ctx = {
      name: "",
      price: 0,
      species: "dog",
      vaccinated: true,
      status: "available",
    } satisfies PetProps;
    const result = PetReserve(ctx);
    expect(result.status).toBe("reserved");
  });

  it('given {"vaccinated":false}, when reserve, then stays available', () => {
    const ctx = {
      name: "",
      price: 0,
      species: "dog",
      vaccinated: false,
      status: "available",
    } satisfies PetProps;
    expect(() => PetReserve(ctx)).toThrow();
  });

  it('given {"price":50,"vaccinated":true}, when sell, then status = sold', () => {
    const ctx = {
      name: "",
      price: 50,
      species: "dog",
      vaccinated: true,
      status: "reserved",
    } satisfies PetProps;
    const result = PetSell(ctx);
    expect(result.status).toBe("sold");
  });

  it('given {"price":0,"vaccinated":true}, when sell, then stays reserved', () => {
    const ctx = {
      name: "",
      price: 0,
      species: "dog",
      vaccinated: true,
      status: "reserved",
    } satisfies PetProps;
    expect(() => PetSell(ctx)).toThrow();
  });
});
