export type PetAdoptionFeeInput = {
  species: "dog" | "cat" | "bird" | "fish";
  vaccinated: boolean;
};

export type PetAdoptionFeeOutput = {
  fee: number;
};

/** Evaluate rules top-to-bottom, return first match. */
export function evaluatePetAdoptionFee(
  input: PetAdoptionFeeInput,
): PetAdoptionFeeOutput {
  if (input.species === "dog" && input.vaccinated === true) return { fee: 50 };
  if (input.species === "dog" && input.vaccinated === false) return { fee: 75 };
  if (input.species === "cat" && input.vaccinated === true) return { fee: 30 };
  if (input.species === "cat" && input.vaccinated === false) return { fee: 45 };
  if (input.species === "bird") return { fee: 20 };
  if (input.species === "fish") return { fee: 15 };
  throw new Error("No matching rule for PetAdoptionFee");
}
