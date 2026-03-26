import type { PetProps } from "../generated/pet.types.js";

export function handlePetUpdatePrice(
  ctx: PetProps,
  _payload: { price: number },
): PetProps {
  // TODO: implement updatePrice
  return ctx;
}

export function handlePetVaccinate(
  ctx: PetProps,
  _payload: { date: string },
): PetProps {
  // TODO: implement vaccinate
  return ctx;
}
