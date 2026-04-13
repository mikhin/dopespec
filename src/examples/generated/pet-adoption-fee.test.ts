import { describe, it, expect } from 'vitest';
import { evaluatePetAdoptionFee } from './pet-adoption-fee.evaluate.js';

describe('PetAdoptionFee', () => {
  it('when species = "dog", vaccinated = true, then fee = 50', () => {
    const result = evaluatePetAdoptionFee({ species: 'dog', vaccinated: true });
    expect(result).toEqual({ fee: 50 });
  });

  it('when species = "dog", vaccinated = false, then fee = 75', () => {
    const result = evaluatePetAdoptionFee({ species: 'dog', vaccinated: false });
    expect(result).toEqual({ fee: 75 });
  });

  it('when species = "cat", vaccinated = true, then fee = 30', () => {
    const result = evaluatePetAdoptionFee({ species: 'cat', vaccinated: true });
    expect(result).toEqual({ fee: 30 });
  });

  it('when species = "cat", vaccinated = false, then fee = 45', () => {
    const result = evaluatePetAdoptionFee({ species: 'cat', vaccinated: false });
    expect(result).toEqual({ fee: 45 });
  });

  it('when species = "bird", then fee = 20', () => {
    const result = evaluatePetAdoptionFee({ species: 'bird', vaccinated: false });
    expect(result).toEqual({ fee: 20 });
  });

  it('when species = "fish", then fee = 15', () => {
    const result = evaluatePetAdoptionFee({ species: 'fish', vaccinated: false });
    expect(result).toEqual({ fee: 15 });
  });

});
